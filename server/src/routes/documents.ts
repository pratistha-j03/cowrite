import { Router } from "express";
import { z } from "zod";
import { prisma } from "@cowrite/shared";
import { AppError, validationError } from "../errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import {sharingRouter} from "./sharing.js";

const titleSchema = z.string().trim().min(1, "Title is required").max(200);
const createSchema = z.object({ title: titleSchema.optional() });
const renameSchema = z.object({ title: titleSchema });

const documentSelect = {
  id: true,
  title: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

// Create: document + owner row, atomically
documentsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw validationError(parsed.error);

  const document = await prisma.document.create({
    data: {
      title: parsed.data.title, // undefined falls back to the "Untitled" default
      permissions: { create: { userId: req.user!.id, role: "owner" } },
    },
    select: documentSelect,
  });
  res.status(201).json({ document: { ...document, role: "owner" } });
});

// List every document I can access
documentsRouter.get("/", async (req, res) => {
  const rows = await prisma.documentPermission.findMany({
    where: { userId: req.user!.id },
    orderBy: { document: { updatedAt: "desc" } },
    select: { role: true, document: { select: documentSelect } },
  });
  res.json({ documents: rows.map((r) => ({ ...r.document, role: r.role })) });
});

// Open one
documentsRouter.get("/:id", requireRole("read"), async (req, res) => {
  const document = await prisma.document.findUnique({
    where: { id: String(req.params.id) },
    select: documentSelect,
  });
  if (!document) throw new AppError(404, "NOT_FOUND", "Document not found");
  res.json({ document: { ...document, role: req.role } });
});

// Rename (owner only)
documentsRouter.patch("/:id", requireRole("rename"), async (req, res) => {
  const parsed = renameSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw validationError(parsed.error);

  const document = await prisma.document.update({
    where: { id: String(req.params.id) },
    data: { title: parsed.data.title },
    select: documentSelect,
  });
  res.json({ document: { ...document, role: req.role } });
});

// Delete (owner only); cascade removes permissions and snapshot
documentsRouter.delete("/:id", requireRole("delete"), async (req, res) => {
  await prisma.document.delete({ where: { id: String(req.params.id) } });
  res.status(204).end();
});

documentsRouter.use("/:id", sharingRouter);