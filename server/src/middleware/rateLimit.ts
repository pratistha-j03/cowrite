import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

const handler = (_req: Request, res: import("express").Response) => {
  res.status(429).json({
    error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." },
  });
};

const base = {
  standardHeaders: "draft-8" as const, 
  legacyHeaders: false,
  handler,
};

const MINUTE = 60 * 1000;

const ip = (req: Request) => ipKeyGenerator(req.ip ?? "");

// 5 wrong passwords per IP + email per 15 minutes
export const loginEmailLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTE,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ip(req)}|${String(req.body?.email ?? "").trim().toLowerCase()}`,
});

// 20 failures per IP per 15 minutes, across all emails
export const loginIpLimiter = rateLimit({
  ...base,
  windowMs: 15 * MINUTE,
  limit: 20,
  skipSuccessfulRequests: true,
  keyGenerator: ip,
});

// 5 sign-ups per IP per hour
export const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * MINUTE,
  limit: 5,
  keyGenerator: ip,
});

// 30 shares per user per hour (runs after requireAuth, so req.user exists)
export const shareLimiter = rateLimit({
  ...base,
  windowMs: 60 * MINUTE,
  limit: 30,
  keyGenerator: (req) => req.user?.id ?? ip(req),
});