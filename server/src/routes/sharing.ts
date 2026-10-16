import { Router } from "express";
import { z } from "zod";
import { prisma, Prisma, getRole } from "@cowrite/shared";
import { AppError, validationError } from "../errors.js";
import { requireRole } from "../middleware/requireRole.js";

const shareRole = z.enum(["editor", "viewer"]);
const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  role: shareRole,
});
const roleSchema = z.object({ role: shareRole });

const memberSelect = {
  role: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

export const sharingRouter = Router({ mergeParams: true });
const guard = requireRole("share");

// List everyone with access (owner first, since that row was created first)
sharingRouter.get("/members", guard, async (req, res) => {
  const rows = await prisma.documentPermission.findMany({
    where: { documentId: String(req.params.id) },
    orderBy: { createdAt: "asc" },
    select: memberSelect,
  });
  res.json({ members: rows.map((r) => ({ ...r.user, role: r.role })) });
});

// Share by email
sharingRouter.post("/share", guard, async (req, res) => {
  const parsed = shareSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw validationError(parsed.error);
  const { email, role } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "No account with that email", {
      email: "No account with that email",
    });
  }

  try {
    const row = await prisma.documentPermission.create({
      data: { documentId: String(req.params.id), userId: user.id, role },
      select: memberSelect,
    });
    res.status(201).json({ member: { ...row.user, role: row.role } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError(409, "ALREADY_MEMBER", "That person already has access", {
        email: "That person already has access",
      });
    }
    throw e;
  }
});

// Change someone's role
sharingRouter.patch("/members/:userId", guard, async (req, res) => {
  const parsed = roleSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw validationError(parsed.error);

  const documentId = String(req.params.id);
  const userId = String(req.params.userId);

  const current = await getRole(userId, documentId);
  if (!current) throw new AppError(404, "MEMBER_NOT_FOUND", "That person doesn't have access");
  if (current === "owner") {
    throw new AppError(403, "CANNOT_MODIFY_OWNER", "The owner's access can't be changed");
  }

  const row = await prisma.documentPermission.update({
    where: { documentId_userId: { documentId, userId } },
    data: { role: parsed.data.role },
    select: memberSelect,
  });
  res.json({ member: { ...row.user, role: row.role } });
});

// Remove someone
sharingRouter.delete("/members/:userId", guard, async (req, res) => {
  const documentId = String(req.params.id);
  const userId = String(req.params.userId);

  const current = await getRole(userId, documentId);
  if (!current) throw new AppError(404, "MEMBER_NOT_FOUND", "That person doesn't have access");
  if (current === "owner") {
    throw new AppError(403, "CANNOT_MODIFY_OWNER", "The owner's access can't be removed");
  }

  await prisma.documentPermission.delete({
    where: { documentId_userId: { documentId, userId } },
  });
  res.status(204).end();
});