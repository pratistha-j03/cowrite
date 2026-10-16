import type { Role } from "@prisma/client";
import { prisma } from "./db.js";

export type Action = "read" | "edit" | "rename" | "share" | "delete";

const ROLE_ACTIONS: Record<Role, readonly Action[]> = {
  owner: ["read", "edit", "rename", "share", "delete"],
  editor: ["read", "edit"],
  viewer: ["read"],
};

export function can(role: Role | null, action: Action): boolean {
  return role !== null && ROLE_ACTIONS[role].includes(action);
}

export async function getRole(userId: string, documentId: string): Promise<Role | null> {
  const row = await prisma.documentPermission.findUnique({
    where: { documentId_userId: { documentId, userId } },
    select: { role: true },
  });
  return row?.role ?? null;
}