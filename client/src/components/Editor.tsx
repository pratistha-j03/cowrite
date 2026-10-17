import { useEffect, useState } from "react";
import { useEditor, useEditorState, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { HocuspocusProvider } from "@hocuspocus/provider";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { useAuth } from "../auth/auth-context";
import { colorFor } from "../lib/colors";

const REALTIME_URL: string = import.meta.env.VITE_REALTIME_URL ?? "ws://localhost:4001";

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const active = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      h1: ctx.editor.isActive("heading", { level: 1 }),
      h2: ctx.editor.isActive("heading", { level: 2 }),
      bullet: ctx.editor.isActive("bulletList"),
      ordered: ctx.editor.isActive("orderedList"),
      quote: ctx.editor.isActive("blockquote"),
      code: ctx.editor.isActive("codeBlock"),
    }),
  });

  const btn = (label: string, on: boolean, run: () => void) => (
    <button type="button" className={on ? "tool active" : "tool"} onClick={run}>
      {label}
    </button>
  );

  const chain = () => editor.chain().focus();

  return (
    <div className="toolbar">
      {btn("B", active.bold, () => chain().toggleBold().run())}
      {btn("I", active.italic, () => chain().toggleItalic().run())}
      {btn("H1", active.h1, () => chain().toggleHeading({ level: 1 }).run())}
      {btn("H2", active.h2, () => chain().toggleHeading({ level: 2 }).run())}
      {btn("• List", active.bullet, () => chain().toggleBulletList().run())}
      {btn("1. List", active.ordered, () => chain().toggleOrderedList().run())}
      {btn("Quote", active.quote, () => chain().toggleBlockquote().run())}
      {btn("Code", active.code, () => chain().toggleCodeBlock().run())}
    </div>
  );
}

type Status = "connecting" | "connected" | "disconnected" | "denied";
interface Peer { id: string; name: string; color: string }

function usePeers(provider: HocuspocusProvider): Peer[] {
  const [peers, setPeers] = useState<Peer[]>([]);
  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;
    const update = () => {
      const seen = new Map<string, Peer>();
      awareness.getStates().forEach((s) => {
        const u = s.user as (Peer & { name: string }) | undefined;
        if (u?.id) seen.set(u.id, u);
      });
      setPeers([...seen.values()]);
    };
    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [provider]);
  return peers;
}

function CollabEditor({
  provider,
  editable,
  status,
}: {
  provider: HocuspocusProvider;
  editable: boolean;
  status: Status;
}) {
  const { user } = useAuth();
  const peers = usePeers(provider);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        undoRedo: false,
      }),
      Collaboration.configure({ document: provider.document }),
      CollaborationCaret.configure({
        provider,
        user: { id: user?.id, name: user?.name, color: colorFor(user?.id ?? "") },
      }),
    ],
    editable,
  });

  if (!editor) return null;

  return (
    <div className="editor-shell">
      <p className={`status status-${status}`}>{status}</p>
      <div className="peers">
        {peers.map((p) => (
          <span key={p.id} className="peer" style={{ background: p.color }}>{p.name}</span>
        ))}
      </div>
      {editable ? <Toolbar editor={editor} /> : <p className="readonly-note">View only</p>}
      <EditorContent editor={editor} />
    </div>
  );
}

export function Editor({ documentId, editable }: { documentId: string; editable: boolean }) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    const p = new HocuspocusProvider({
      url: REALTIME_URL,
      name: documentId,
      token: "cookie", // placeholder: the real credential is the httpOnly cookie
      onStatus: ({ status }) => setStatus(status as Status),
      onAuthenticationFailed: () => setStatus("denied"),
    });
    setProvider(p);
    return () => {
      p.destroy();
      setProvider(null);
    };
  }, [documentId]);

  if (!provider) return null;
  return <CollabEditor provider={provider} editable={editable} status={status} />;
}