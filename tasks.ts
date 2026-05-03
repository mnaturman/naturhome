import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

router.get("/tasks", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { familyMemberId, completed } = req.query;

  const conditions = [eq(tasksTable.userId, userId)];
  if (familyMemberId) conditions.push(eq(tasksTable.familyMemberId, parseInt(familyMemberId as string)));
  if (completed !== undefined) conditions.push(eq(tasksTable.completed, completed === "true"));

  const tasks = await db.select().from(tasksTable).where(and(...conditions));
  res.json(tasks);
});

router.post("/tasks", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { title, notes, dueDate, priority, familyMemberId, category } = req.body;
  const [task] = await db
    .insert(tasksTable)
    .values({
      userId,
      title,
      notes,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority ?? "medium",
      familyMemberId,
      category: category ?? "other",
    })
    .returning();
  res.status(201).json(task);
});

router.put("/tasks/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const { title, notes, completed, dueDate, priority, familyMemberId, category } = req.body;
  const [task] = await db
    .update(tasksTable)
    .set({
      title,
      notes,
      completed,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      familyMemberId,
      category,
    })
    .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)))
    .returning();
  if (!task) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(task);
});

router.delete("/tasks/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  await db.delete(tasksTable)
    .where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));
  res.status(204).send();
});

export default router;
