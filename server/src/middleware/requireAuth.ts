import type { RequestHandler } from "express";
import { prisma, verifyToken, AUTH_COOKIE_NAME } from "@cowrite/shared";
import { AppError } from "../errors.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  const payload = typeof token === "string" ? verifyToken(token) : null;
  if (!payload) throw new AppError(401, "UNAUTHENTICATED", "Please log in");

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) throw new AppError(401, "UNAUTHENTICATED", "Please log in");

  req.user = user;
  next();
};