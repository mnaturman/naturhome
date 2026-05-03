import { Router } from "express";
import { db } from "@workspace/db";
import { calendarEventsTable, tasksTable, mealsTable, familyMembersTable } from "@workspace/db";
import { eq, and, gte, lte, count } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const weekStart = new Date(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    totalEventsResult,
    totalTasksResult,
    pendingTasksResult,
    completedTasksResult,
    totalMembersResult,
    mealsThisWeekResult,
    eventsTodayResult,
    eventsTomorrowResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(calendarEventsTable).where(eq(calendarEventsTable.userId, userId)),
    db.select({ count: count() }).from(tasksTable).where(eq(tasksTable.userId, userId)),
    db.select({ count: count() }).from(tasksTable).where(and(eq(tasksTable.userId, userId), eq(tasksTable.completed, false))),
    db.select({ count: count() }).from(tasksTable).where(and(eq(tasksTable.userId, userId), eq(tasksTable.completed, true))),
    db.select({ count: count() }).from(familyMembersTable).where(eq(familyMembersTable.userId, userId)),
    db.select({ count: count() }).from(mealsTable).where(and(eq(mealsTable.userId, userId), gte(mealsTable.date, weekStart), lte(mealsTable.date, weekEnd))),
    db.select({ count: count() }).from(calendarEventsTable).where(and(eq(calendarEventsTable.userId, userId), gte(calendarEventsTable.startTime, today), lte(calendarEventsTable.startTime, tomorrow))),
    db.select({ count: count() }).from(calendarEventsTable).where(and(eq(calendarEventsTable.userId, userId), gte(calendarEventsTable.startTime, tomorrow), lte(calendarEventsTable.startTime, dayAfterTomorrow))),
  ]);

  res.json({
    totalEvents: totalEventsResult[0]?.count ?? 0,
    totalTasks: totalTasksResult[0]?.count ?? 0,
    pendingTasks: pendingTasksResult[0]?.count ?? 0,
    completedTasks: completedTasksResult[0]?.count ?? 0,
    totalFamilyMembers: totalMembersResult[0]?.count ?? 0,
    mealsPlannedThisWeek: mealsThisWeekResult[0]?.count ?? 0,
    eventsToday: eventsTodayResult[0]?.count ?? 0,
    eventsTomorrow: eventsTomorrowResult[0]?.count ?? 0,
  });
});

router.get("/dashboard/upcoming-events", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const events = await db
    .select()
    .from(calendarEventsTable)
    .where(and(
      eq(calendarEventsTable.userId, userId),
      gte(calendarEventsTable.startTime, now),
      lte(calendarEventsTable.startTime, nextWeek)
    ));
  res.json(events);
});

router.get("/dashboard/pending-tasks", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), eq(tasksTable.completed, false)));
  res.json(tasks);
});

router.get("/dashboard/this-week-meals", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const meals = await db
    .select()
    .from(mealsTable)
    .where(and(
      eq(mealsTable.userId, userId),
      gte(mealsTable.date, today),
      lte(mealsTable.date, weekEnd)
    ));
  res.json(meals);
});

export default router;
