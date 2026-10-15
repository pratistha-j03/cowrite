import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export type Role = "owner" | "editor" | "viewer";

export * from "./auth.js";
export { Prisma } from "@prisma/client";