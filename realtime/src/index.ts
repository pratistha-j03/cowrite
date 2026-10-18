import { Server } from "@hocuspocus/server";
import * as Y from "yjs";
import { prisma } from "@cowrite/shared";
import {  verifyToken, getRole, can } from "@cowrite/shared";
import { Redis } from "ioredis";
import { PERMISSIONS_CHANNEL, type PermissionChange } from "@cowrite/shared";
const port = Number(process.env.PORT ?? process.env.REALTIME_PORT ?? 4001);

const server = new Server({
  port,
  debounce: 2000,     // save 2s after the last edit
  maxDebounce: 10000, // but never wait longer than 10s while typing continues

  async onLoadDocument({ document, documentName }) {
    const snap = await prisma.documentSnapshot.findUnique({
      where: { documentId: documentName },
      select: { state: true },
    });
    if (snap) Y.applyUpdate(document, new Uint8Array(snap.state));
    return document;
  },

  async onStoreDocument({ document, documentName }) {
    const state = Buffer.from(Y.encodeStateAsUpdate(document));
    await prisma.$transaction([
      prisma.documentSnapshot.upsert({
        where: { documentId: documentName },
        create: { documentId: documentName, state },
        update: { state },
      }),
      prisma.document.update({
        where: { id: documentName },
        data: { updatedAt: new Date() },
      }),
    ]);
  },


  async onAuthenticate({ token, requestHeaders, documentName, connectionConfig }) {
    // 1. Only our own client may open sockets
    const origin = requestHeaders.get("origin");
    if (origin !== process.env.CLIENT_ORIGIN) {
      console.log("origin:", origin, "| expected:", process.env.CLIENT_ORIGIN);
      throw new Error("forbidden-origin");
    }

    // 2. Who is this? (same verification as the REST API)
    const payload = token ? verifyToken(token) : null;
    if (!payload) throw new Error("unauthenticated");

    // 3. What may they do on this document?
    const role = await getRole(payload.userId, documentName);
    if (!role) throw new Error("not-found");
    if (!can(role, "edit")) connectionConfig.readOnly = true;

    return { userId: payload.userId, role };
  },
});

server.listen().then(() => {
  console.log(`Realtime listening on ws://localhost:${port}`);
});
const sub = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
sub.on("error", (err) => console.error("[redis subscriber]", err.message));

sub.subscribe(PERMISSIONS_CHANNEL).catch((err) => console.error("[subscribe failed]", err));

sub.on("message", (_channel, raw) => {
  let msg: PermissionChange;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  if (typeof msg?.documentId !== "string" || typeof msg?.userId !== "string") return;

  const doc = server.hocuspocus.documents.get(msg.documentId);
  if (!doc) return; 

  for (const conn of doc.getConnections()) {
    if (msg.userId === "*" || conn.context?.userId === msg.userId) {
      conn.close({ code: 4403, reason: "permissions-changed" });
    }
  }
});