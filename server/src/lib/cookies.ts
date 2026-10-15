import type { Response } from "express";
import { AUTH_COOKIE_NAME, TOKEN_TTL_SECONDS } from "@cowrite/shared";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TOKEN_TTL_SECONDS * 1000,
};

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
}

export function clearAuthCookie(res: Response) {
  const { maxAge, ...opts } = cookieOptions;
  res.clearCookie(AUTH_COOKIE_NAME, opts);
}