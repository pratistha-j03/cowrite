import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma, Prisma, signToken } from "@cowrite/shared";
import { AppError, validationError } from "../errors.js";
import { setAuthCookie, clearAuthCookie } from "../lib/cookies.js";
import { requireAuth } from "../middleware/requireAuth.js";

const BCRYPT_COST = 12;

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine((p) => Buffer.byteLength(p) <= 72, "Password is too long (max 72 bytes)"),
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw validationError(parsed.error);
  const { name, email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true },
    });
    setAuthCookie(res, signToken(user.id));
    res.status(201).json({ user });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError(409, "EMAIL_TAKEN", "Email is already registered", {
        email: "Email is already registered",
      });
    }
    throw e;
  }
});

const DUMMY_HASH = bcrypt.hashSync("cowrite-dummy-password", BCRYPT_COST);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128)
    .refine((p) => Buffer.byteLength(p) <= 72, "Invalid email or password"),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw validationError(parsed.error);
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  setAuthCookie(res, signToken(user.id));
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});