import { Server } from "@hocuspocus/server";
import { parse } from "cookie";
import * as Y from "yjs";
import { prisma } from "@cowrite/shared";
import { AUTH_COOKIE_NAME, verifyToken, getRole, can } from "@cowrite/shared";

const port = Number(process.env.REALTIME_PORT ?? 4001);

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


  async onAuthenticate({ requestHeaders, documentName, connectionConfig }) {
    // 1. Only our own client may open sockets
    const origin = requestHeaders.get("origin");
    if (origin !== process.env.CLIENT_ORIGIN) {
      console.log("origin:", origin, "| expected:", process.env.CLIENT_ORIGIN);
      throw new Error("forbidden-origin");
    }

    // 2. Who is this? (same verification as the REST API)
    const token = parse(requestHeaders.get("cookie") ?? "")[AUTH_COOKIE_NAME];
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