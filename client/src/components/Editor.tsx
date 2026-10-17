import { useEffect, useRef, useState, type ReactNode } from "react";
import { useEditor, useEditorState, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Bold, Code, Eye, Heading1, Heading2, Italic, List, ListOrdered, Quote, Users } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { colorFor } from "../lib/colors";

const REALTIME_URL: string = import.meta.env.VITE_REALTIME_URL ?? "ws://localhost:4001";

function ToolBtn({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`p-2.5 transition-colors ${active ? "bg-ink text-paper" : "text-ink hover:bg-line"}`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-2 h-6 w-px bg-line" />;

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const a = useEditorState({
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
  const chain = () => editor.chain().focus();
  const icon = "size-[18px]";

  return (
    <div className="flex flex-wrap items-center border-b border-line px-3 py-2">
      <ToolBtn label="Bold" active={a.bold} onClick={() => chain().toggleBold().run()}>
        <Bold className={icon} />
      </ToolBtn>
      <ToolBtn label="Italic" active={a.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic className={icon} />
      </ToolBtn>
      <Divider />
      <ToolBtn label="Heading 1" active={a.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <Heading1 className={icon} />
      </ToolBtn>
      <ToolBtn label="Heading 2" active={a.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className={icon} />
      </ToolBtn>
      <Divider />
      <ToolBtn label="Bullet list" active={a.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List className={icon} />
      </ToolBtn>
      <ToolBtn label="Numbered list" active={a.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered className={icon} />
      </ToolBtn>
      <ToolBtn label="Quote" active={a.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote className={icon} />
      </ToolBtn>
      <ToolBtn label="Code block" active={a.code} onClick={() => chain().toggleCodeBlock().run()}>
        <Code className={icon} />
      </ToolBtn>
    </div>
  );
}

type Status = "connecting" | "connected" | "disconnected" | "denied";

const statusStyle: Record<Status, { dot: string; text: string }> = {
  connected: { dot: "bg-[#6f7f3d] ring-4 ring-sage/40", text: "Connected" },
  connecting: { dot: "bg-[#c58a2b] animate-pulse", text: "Connecting" },
  disconnected: { dot: "bg-[#c58a2b]", text: "Offline" },
  denied: { dot: "bg-[#9b2c2c]", text: "No access" },
};

interface Peer {
  id: string;
  name: string;
  color: string;
}

function usePeers(provider: HocuspocusProvider): Peer[] {
  const [peers, setPeers] = useState<Peer[]>([]);
  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;
    const update = () => {
      const seen = new Map<string, Peer>();
      awareness.getStates().forEach((s) => {
        const u = s.user as Peer | undefined;
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

function Footer({ editor, status }: { editor: TiptapEditor; status: Status }) {
  const words = useEditorState({
    editor,
    selector: (ctx) => ctx.editor.getText().split(/\s+/).filter(Boolean).length,
  });
  const note =
    status === "connected"
      ? "Changes sync live"
      : status === "denied"
        ? "Read access lost"
        : "Will sync when back online";

  return (
    <div className="eyebrow flex items-center justify-between border-t border-line px-5 py-3 text-[0.68rem] text-muted">
      <span>{words} {words === 1 ? "word" : "words"}</span>
      <span>{note}</span>
    </div>
  );
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
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, undoRedo: false }),
      Collaboration.configure({ document: provider.document }),
      CollaborationCaret.configure({
        provider,
        user: { id: user?.id, name: user?.name, color: colorFor(user?.id ?? "") },
      }),
    ],
    editable,
    editorProps: { attributes: { class: "editor-content" } },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return null;
  const s = statusStyle[status];

  return (
    <div className="border border-line bg-surface shadow-[10px_10px_0_var(--sky)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="eyebrow flex items-center gap-3 text-muted">
          <span className={`size-2.5 rounded-full ${s.dot}`} />
          {s.text}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {peers.map((p) => (
              <span
                key={p.id}
                title={p.name}
                style={{ background: p.color }}
                className="flex size-7 items-center justify-center rounded-full border-2 border-surface text-xs font-bold uppercase text-white"
              >
                {p.name.slice(0, 1)}
              </span>
            ))}
          </div>
          <span className="eyebrow flex items-center gap-2 text-[0.68rem] text-muted">
            <Users className="size-4" />
            {peers.length} {peers.length === 1 ? "person" : "people"} here
          </span>
        </div>
      </div>

      {editable ? (
        <Toolbar editor={editor} />
      ) : (
        <div className="eyebrow flex items-center gap-2 border-b border-line px-5 py-3 text-muted">
          <Eye className="size-4" /> View only
        </div>
      )}

      <EditorContent editor={editor} />
      <Footer editor={editor} status={status} />
    </div>
  );
}

export function Editor({
  documentId,
  editable,
  onAccessChange,
}: {
  documentId: string;
  editable: boolean;
  onAccessChange?: () => void;
}) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [status, setStatus] = useState<Status>("connecting");

  const accessRef = useRef(onAccessChange);
  useEffect(() => {
    accessRef.current = onAccessChange;
  });

  useEffect(() => {
    let wasConnected = false;
    const p = new HocuspocusProvider({
      url: REALTIME_URL,
      name: documentId,
      token: "cookie", // placeholder: the real credential is the httpOnly cookie
      onStatus: ({ status }) => {
        setStatus(status as Status);
        if (status === "connected") {
          if (wasConnected) accessRef.current?.(); // reconnect: re-check my role
          wasConnected = true;
        }
      },
      onClose: ({ event }) => {
        if (event?.code === 4403) accessRef.current?.(); // kicked by a permission change
      },
      onAuthenticationFailed: () => {
        setStatus("denied");
        accessRef.current?.();
      },
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