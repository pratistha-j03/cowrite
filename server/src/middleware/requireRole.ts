import type { RequestHandler } from "express";
import { getRole, can, type Action, type Role } from "@cowrite/shared";
import { AppError } from "../errors.js";

declare global {
  namespace Express {
    interface Request {
      role?: Role;
    }
  }
}

export function requireRole(action: Action): RequestHandler {
  return async (req, _res, next) => {
    if (!req.user) throw new AppError(401, "UNAUTHENTICATED", "Please log in");

    const role = await getRole(req.user.id, String(req.params.id));
    if (!role) throw new AppError(404, "NOT_FOUND", "Document not found");
    if (!can(role, action)) {
      throw new AppError(403, "FORBIDDEN", "You don't have permission to do that");
    }

    req.role = role;
    next();
  };
}