import { Router } from "express";
import { db } from "@workspace/db";
import { familyMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

router.get("/family-members", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const members = await db
    .select()
    .from(familyMembersTable)
    .where(eq(familyMembersTable.userId, userId));
  res.json(members);
});

router.post("/family-members", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { name, role, color, avatarInitials } = req.body;
  const [member] = await db
    .insert(familyMembersTable)
    .values({ userId, name, role, color, avatarInitials })
    .returning();
  res.status(201).json(member);
});

router.get("/family-members/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const [member] = await db
    .select()
    .from(familyMembersTable)
    .where(eq(familyMembersTable.id, id));
  if (!member || member.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(member);
});

router.put("/family-members/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const { name, role, color, avatarInitials } = req.body;
  const [member] = await db
    .update(familyMembersTable)
    .set({ name, role, color, avatarInitials })
    .where(eq(familyMembersTable.id, id))
    .returning();
  if (!member || member.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(member);
});

router.delete("/family-members/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const id = parseInt(req.params.id as string);
  const [member] = await db
    .select()
    .from(familyMembersTable)
    .where(eq(familyMembersTable.id, id));
  if (!member || member.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.delete(familyMembersTable).where(eq(familyMembersTable.id, id));
  res.status(204).send();
});

export default router;
