import { Router } from "express";
import { db } from "@workspace/db";
import { mealsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// Return date as plain YYYY-MM-DD to avoid timezone shift on the client
function formatMeal(meal: typeof mealsTable.$inferSelect) {
  return {
    ...meal,
    date: meal.date instanceof Date
      ? meal.date.toISOString().slice(0, 10)
      : String(meal.date).slice(0, 10),
  };
}

// Store dates at noon UTC so they never slip a day regardless of server timezone
function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00.000Z");
}

router.get("/meals", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { weekOf } = req.query;

  const conditions = [eq(mealsTable.userId, userId)];
  if (weekOf) {
    const weekStart = parseDate(weekOf as string);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    conditions.push(gte(mealsTable.date, weekStart));
    conditions.push(lte(mealsTable.date, weekEnd));
  }

  const meals = await db.select().from(mealsTable).where(and(...conditions));
  res.json(meals.map(formatMeal));
});

router.post("/meals", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { name, mealType, date, notes, ingredients } = req.body;
  const [meal] = await db
    .insert(mealsTable)
    .values({
      userId,
      name,
      mealType: mealType ?? "dinner",
      date: parseDate(date),
      notes,
      ingredients,
    })
    .returning();
  res.status(201).json(formatMeal(meal));
});

router.put("/meals/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const { name, mealType, date, notes, ingredients } = req.body;
  const [meal] = await db
    .update(mealsTable)
    .set({
      name,
      mealType,
      date: date ? parseDate(date) : undefined,
      notes,
      ingredients,
    })
    .where(and(eq(mealsTable.id, id), eq(mealsTable.userId, userId)))
    .returning();
  if (!meal) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatMeal(meal));
});

router.delete("/meals/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  await db.delete(mealsTable)
    .where(and(eq(mealsTable.id, id), eq(mealsTable.userId, userId)));
  res.status(204).send();
});

export default router;
