import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, calendarEventsTable, tasksTable, mealsTable } from "@workspace/db";
import { eq, and, ilike, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireAuth } from "./auth";

const router = Router();

const tools = [
  {
    type: "function" as const,
    function: {
      name: "create_event",
      description: "Create a new calendar event for the family. Use this when the user asks to add, schedule, or create an event, appointment, or anything time-based.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          description: { type: "string", description: "Optional description" },
          startTime: { type: "string", description: "Start datetime in ISO 8601 format (e.g. 2026-05-03T14:00:00)" },
          endTime: { type: "string", description: "End datetime in ISO 8601 format" },
          allDay: { type: "boolean", description: "True if this is an all-day event" },
          location: { type: "string", description: "Optional location" },
          category: { type: "string", enum: ["work", "family", "health", "social", "other"], description: "Event category" },
        },
        required: ["title", "startTime", "endTime"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task or to-do item. Use this when the user asks to add, create, or remind them about a task, chore, or to-do.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          notes: { type: "string", description: "Optional notes or details" },
          dueDate: { type: "string", description: "Optional due date in ISO 8601 format" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
          category: { type: "string", enum: ["work", "family", "health", "shopping", "other"], description: "Task category" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_meal",
      description: "Plan a meal for a specific date and meal slot. Use this when the user asks to plan, add, or schedule a meal.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Meal name (e.g. Spaghetti Bolognese)" },
          mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"], description: "Type of meal" },
          date: { type: "string", description: "Date for the meal in ISO 8601 format" },
          notes: { type: "string", description: "Optional cooking notes or recipe tips" },
          ingredients: { type: "string", description: "Optional comma-separated list of key ingredients" },
        },
        required: ["name", "mealType", "date"],
      },
    },
  },
] as const;

const systemPrompt = `You are NaturHome AI, a helpful home and family management assistant. Today's date is ${new Date().toISOString().split("T")[0]}. You help families coordinate schedules, manage tasks, plan meals, and stay organized.

IMPORTANT FORMATTING RULES:
- Always use markdown formatting to make responses scannable and easy to read
- Use **bold** for important items, dates, names
- Use bullet lists (- item) for multiple items, steps, or options
- Use numbered lists (1. step) for sequential instructions
- Use ## headings to organize longer responses into sections
- Keep paragraphs short (2-3 sentences max)
- Lead with the most important information first

TOOL USE:
- When the user asks to create an event, task, or meal — always use the appropriate tool immediately. Do not ask for confirmation first.
- After using a tool, briefly confirm what was created and ask if anything else needs adjusting.
- If the user gives you vague information (e.g. "tomorrow"), infer the date using today's date above.
- When creating multiple items (e.g. "plan meals for the week"), call the tools multiple times in the same response.`;

router.get("/openai/conversations", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const q = req.query.q as string | undefined;

  const convos = await db
    .select()
    .from(conversations)
    .where(
      q
        ? and(eq(conversations.userId, userId), ilike(conversations.title, `%${q}%`))
        : eq(conversations.userId, userId),
    )
    .orderBy(desc(conversations.updatedAt));

  res.json(convos);
});

router.post("/openai/conversations", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { title } = req.body;
  const [convo] = await db
    .insert(conversations)
    .values({ userId, title: title ?? "New Conversation" })
    .returning();
  res.status(201).json(convo);
});

router.get("/openai/conversations/:id/messages", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const [convo] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!convo || convo.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id));
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const { content } = req.body;

  const [convo] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!convo || convo.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.insert(messages).values({ conversationId: id, role: "user", content });

  const allMessages = await db.select().from(messages).where(eq(messages.conversationId, id));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...allMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  let fullResponse = "";
  const isFirstExchange = allMessages.filter((m) => m.role === "user").length === 1;

  try {
    // Phase 1: stream with tools enabled, accumulate tool calls
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: chatMessages,
      tools: tools as any,
      stream: true,
    });

    type AccumulatedToolCall = {
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    };
    const accumulatedToolCalls: AccumulatedToolCall[] = [];
    let finishReason = "";

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      // Stream text content tokens to client
      if (choice.delta?.content) {
        fullResponse += choice.delta.content;
        res.write(`data: ${JSON.stringify({ content: choice.delta.content })}\n\n`);
      }

      // Accumulate tool call deltas
      if (choice.delta?.tool_calls) {
        for (const tc of choice.delta.tool_calls) {
          if (!accumulatedToolCalls[tc.index]) {
            accumulatedToolCalls[tc.index] = {
              id: tc.id ?? "",
              type: "function",
              function: { name: tc.function?.name ?? "", arguments: "" },
            };
          }
          if (tc.id) accumulatedToolCalls[tc.index].id = tc.id;
          if (tc.function?.name) accumulatedToolCalls[tc.index].function.name = tc.function.name;
          if (tc.function?.arguments) accumulatedToolCalls[tc.index].function.arguments += tc.function.arguments;
        }
      }

      if (choice.finish_reason) finishReason = choice.finish_reason;
    }

    // Phase 2: if tool calls were requested, execute them
    if (finishReason === "tool_calls" && accumulatedToolCalls.length > 0) {
      const toolResults: { tool_call_id: string; role: "tool"; content: string }[] = [];

      for (const tc of accumulatedToolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {
          args = {};
        }

        let resultText = "";

        if (tc.function.name === "create_event") {
          const startTime = new Date(args.startTime as string);
          const endTime = new Date(args.endTime as string);
          const [event] = await db
            .insert(calendarEventsTable)
            .values({
              userId,
              title: args.title as string,
              description: (args.description as string) ?? null,
              startTime,
              endTime,
              allDay: (args.allDay as boolean) ?? false,
              location: (args.location as string) ?? null,
              category: (args.category as string) ?? "other",
            })
            .returning();
          resultText = `Created event "${event.title}" successfully (id: ${event.id})`;
          res.write(`data: ${JSON.stringify({ action: "create_event", label: event.title, icon: "calendar" })}\n\n`);
        } else if (tc.function.name === "create_task") {
          const dueDate = args.dueDate ? new Date(args.dueDate as string) : null;
          const [task] = await db
            .insert(tasksTable)
            .values({
              userId,
              title: args.title as string,
              notes: (args.notes as string) ?? null,
              dueDate,
              priority: (args.priority as string) ?? "medium",
              category: (args.category as string) ?? "other",
              completed: false,
            })
            .returning();
          resultText = `Created task "${task.title}" successfully (id: ${task.id})`;
          res.write(`data: ${JSON.stringify({ action: "create_task", label: task.title, icon: "check-square" })}\n\n`);
        } else if (tc.function.name === "create_meal") {
          const date = new Date(args.date as string);
          const [meal] = await db
            .insert(mealsTable)
            .values({
              userId,
              name: args.name as string,
              mealType: (args.mealType as string) ?? "dinner",
              date,
              notes: (args.notes as string) ?? null,
              ingredients: (args.ingredients as string) ?? null,
            })
            .returning();
          resultText = `Created meal "${meal.name}" for ${meal.mealType} successfully (id: ${meal.id})`;
          res.write(`data: ${JSON.stringify({ action: "create_meal", label: meal.name, icon: "utensils" })}\n\n`);
        } else {
          resultText = `Unknown tool: ${tc.function.name}`;
        }

        toolResults.push({ tool_call_id: tc.id, role: "tool", content: resultText });
      }

      // Phase 3: stream final response after tool execution
      const followUpMessages: any[] = [
        ...chatMessages,
        { role: "assistant", content: null, tool_calls: accumulatedToolCalls },
        ...toolResults,
      ];

      const stream2 = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 8192,
        messages: followUpMessages,
        stream: true,
      });

      for await (const chunk of stream2) {
        const chunkContent = chunk.choices[0]?.delta?.content;
        if (chunkContent) {
          fullResponse += chunkContent;
          res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
        }
      }
    }

    // Save assistant response
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    // Auto-name conversation on first exchange
    const now = new Date();
    const updateData: { updatedAt: Date; title?: string } = { updatedAt: now };

    if (isFirstExchange && convo.title === "New Conversation") {
      try {
        const titleCompletion = await openai.chat.completions.create({
          model: "gpt-5.4",
          max_completion_tokens: 20,
          messages: [
            {
              role: "user",
              content: `Generate a short 3-6 word title (no quotes, no punctuation) for a conversation that starts with this message: "${content.substring(0, 200)}"`,
            },
          ],
        });
        const generatedTitle =
          titleCompletion.choices[0]?.message?.content?.trim().replace(/['"]/g, "") ||
          content.substring(0, 40);
        updateData.title = generatedTitle;
        res.write(`data: ${JSON.stringify({ titleUpdate: generatedTitle })}\n\n`);
      } catch {
        updateData.title = content.substring(0, 40);
      }
    }

    await db.update(conversations).set(updateData).where(eq(conversations.id, id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log?.error({ err }, "AI stream error");
    res.write(`data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`);
    res.end();
  }
});

export default router;
