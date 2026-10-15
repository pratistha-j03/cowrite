import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "cowrite_token";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface TokenPayload {
  userId: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is missing or too short (min 32 chars)");
  }
  return secret;
}

export function signToken(userId: string): string {
  return jwt.sign({}, getSecret(), {
    algorithm: "HS256",
    subject: userId,
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  const secret = getSecret(); // outside try: misconfig should crash, not look like a bad token
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof decoded === "string" || !decoded.sub) return null;
    return { userId: decoded.sub };
  } catch {
    return null;
  }
}