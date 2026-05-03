import { Router } from "express";
import { db } from "@workspace/db";
import { calendarEventsTable } from "@workspace/db";
import { eq, and, gte, lte, ne, or, isNull } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

type DbEvent = typeof calendarEventsTable.$inferSelect;

function expandRecurringEvent(event: DbEvent, rangeStart: Date, rangeEnd: Date): DbEvent[] {
  const { recurrence, recurrenceDays, recurrenceEndDate, startTime, endTime } = event;
  if (!recurrence || recurrence === "none") return [];

  const duration = endTime.getTime() - startTime.getTime();
  const originDate = new Date(startTime);

  const effectiveEnd = recurrenceEndDate
    ? new Date(Math.min(new Date(recurrenceEndDate).getTime(), rangeEnd.getTime()))
    : rangeEnd;

  const allowedDays = recurrenceDays
    ? new Set(recurrenceDays.split(",").map(Number))
    : new Set<number>();

  // Origin week Sunday
  const originWeekSunday = new Date(originDate);
  originWeekSunday.setHours(0, 0, 0, 0);
  originWeekSunday.setDate(originWeekSunday.getDate() - originWeekSunday.getDay());

  const instances: DbEvent[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= effectiveEnd) {
    let include = false;
    const dayOfWeek = cursor.getDay();

    if (recurrence === "daily") {
      include = true;
    } else if (recurrence === "weekly") {
      include =
        allowedDays.size === 0
          ? dayOfWeek === originDate.getDay()
          : allowedDays.has(dayOfWeek);
    } else if (recurrence === "biweekly") {
      const curWeekSunday = new Date(cursor);
      curWeekSunday.setDate(curWeekSunday.getDate() - curWeekSunday.getDay());
      const weekDiff = Math.round(
        (curWeekSunday.getTime() - originWeekSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const dayMatches =
        allowedDays.size === 0
          ? dayOfWeek === originDate.getDay()
          : allowedDays.has(dayOfWeek);
      include = dayMatches && weekDiff % 2 === 0;
    } else if (recurrence === "monthly") {
      include = cursor.getDate() === originDate.getDate();
    }

    if (include) {
      const instanceStart = new Date(cursor);
      instanceStart.setHours(originDate.getHours(), originDate.getMinutes(), 0, 0);
      const instanceEnd = new Date(instanceStart.getTime() + duration);
      if (instanceStart <= rangeEnd && instanceStart >= rangeStart) {
        instances.push({ ...event, startTime: instanceStart, endTime: instanceEnd });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return instances;
}

router.get("/events", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { startDate, endDate, familyMemberId } = req.query;

  const rangeStart = startDate ? new Date(startDate as string) : new Date(0);
  const rangeEnd = endDate ? new Date(endDate as string) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const userCondition = eq(calendarEventsTable.userId, userId);
  const memberCondition = familyMemberId
    ? eq(calendarEventsTable.familyMemberId, parseInt(familyMemberId as string))
    : undefined;

  const baseConditions = memberCondition ? and(userCondition, memberCondition) : userCondition;

  // Fetch non-recurring events within the date range
  const nonRecurringConditions = and(
    baseConditions,
    or(isNull(calendarEventsTable.recurrence), eq(calendarEventsTable.recurrence, "none")),
    gte(calendarEventsTable.startTime, rangeStart),
    lte(calendarEventsTable.endTime, rangeEnd)
  );
  const nonRecurring = await db.select().from(calendarEventsTable).where(nonRecurringConditions);

  // Fetch recurring templates (recurrence !== 'none' and started before rangeEnd)
  const recurringConditions = and(
    baseConditions,
    ne(calendarEventsTable.recurrence, "none"),
    lte(calendarEventsTable.startTime, rangeEnd)
  );
  const recurringTemplates = await db.select().from(calendarEventsTable).where(recurringConditions);

  // Expand recurring events
  const expanded: DbEvent[] = [];
  for (const template of recurringTemplates) {
    const instances = expandRecurringEvent(template, rangeStart, rangeEnd);
    expanded.push(...instances);
  }

  res.json([...nonRecurring, ...expanded]);
});

router.post("/events", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const {
    title, description, startTime, endTime, allDay, location,
    familyMemberId, color, category,
    recurrence, recurrenceDays, recurrenceEndDate,
  } = req.body;
  const [event] = await db
    .insert(calendarEventsTable)
    .values({
      userId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      allDay: allDay ?? false,
      location,
      familyMemberId,
      color,
      category: category ?? "other",
      recurrence: recurrence ?? "none",
      recurrenceDays: recurrenceDays || null,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
    })
    .returning();
  res.status(201).json(event);
});

router.get("/events/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const [event] = await db.select().from(calendarEventsTable).where(eq(calendarEventsTable.id, id));
  if (!event || event.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(event);
});

router.put("/events/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const {
    title, description, startTime, endTime, allDay, location,
    familyMemberId, color, category,
    recurrence, recurrenceDays, recurrenceEndDate,
  } = req.body;
  const [event] = await db
    .update(calendarEventsTable)
    .set({
      title,
      description,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      allDay,
      location,
      familyMemberId,
      color,
      category,
      recurrence: recurrence ?? "none",
      recurrenceDays: recurrenceDays || null,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
    })
    .where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, userId)))
    .returning();
  if (!event) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(event);
});

router.delete("/events/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  await db.delete(calendarEventsTable)
    .where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, userId)));
  res.status(204).send();
});

export default router;
