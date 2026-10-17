import { Redis } from "ioredis";
import { PERMISSIONS_CHANNEL, type PermissionChange } from "@cowrite/shared";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
redis.on("error", (err) => console.error("[redis publisher]", err.message));

// Fire-and-forget: a Redis outage must never fail the user's request.
export async function publishPermissionChange(documentId: string, userId: string) {
  const msg: PermissionChange = { documentId, userId };
  try {
    await redis.publish(PERMISSIONS_CHANNEL, JSON.stringify(msg));
  } catch (err) {
    console.error("[redis publish failed]", err);
  }
}