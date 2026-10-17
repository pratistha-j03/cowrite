import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Clock, FileText, Plus } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { timeAgo } from "../lib/time";
import type { DocumentSummary } from "../types";
import { AppHeader } from "../components/AppHeader";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { RenameDialog } from "../components/ui/RenameDialog";
import { DocMenu } from "../components/DocMenu";
import { RoleBadge } from "../components/RoleBadge";
import { useToast } from "../components/toast/toast-context";

function messageOf(err: unknown) {
  return err instanceof ApiError ? err.message : "Something went wrong";
}

export function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<DocumentSummary | null>(null);
  const [deleting, setDeleting] = useState<DocumentSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ documents: DocumentSummary[] }>("/documents")
      .then((d) => {
        if (!cancelled) setDocs(d.documents);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(messageOf(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function create() {
    setBusy(true);
    try {
      const d = await api<{ document: DocumentSummary }>("/documents", { method: "POST" });
      navigate(`/documents/${d.document.id}`);
    } catch (err) {
      toast.show("error", messageOf(err));
      setBusy(false);
    }
  }

  async function submitRename(title: string) {
    if (!renaming) return;
    const doc = renaming;
    setBusy(true);
    try {
      const d = await api<{ document: DocumentSummary }>(`/documents/${doc.id}`, {
        method: "PATCH",
        body: { title },
      });
      setDocs((prev) => [d.document, ...prev.filter((x) => x.id !== doc.id)]);
      toast.show("success", "Document renamed");
    } catch (err) {
      toast.show("error", messageOf(err));
    } finally {
      setBusy(false);
      setRenaming(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const doc = deleting;
    setBusy(true);
    try {
      await api(`/documents/${doc.id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((x) => x.id !== doc.id));
      toast.show("success", "Document deleted");
    } catch (err) {
      toast.show("error", messageOf(err));
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  const owned = docs.filter((d) => d.role === "owner").length;
  const shared = docs.length - owned;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="flex flex-wrap items-end justify-between gap-6 pb-12 pt-16">
          <div>
            <p className="eyebrow text-accent">Your workspace</p>
            <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight sm:text-7xl">
              Ready when you are.
            </h1>
            <p className="mt-5 text-lg text-muted">Continue a thought or make space for a new one.</p>
          </div>
          <Button onClick={() => void create()} loading={busy} className="px-7 py-4 text-base">
            <Plus className="size-5" /> New document
          </Button>
        </section>

        {!loading && docs.length > 0 && (
          <section className="mb-16 flex flex-wrap items-center justify-between gap-4 border border-line bg-surface px-8 py-6 shadow-[10px_10px_0_var(--sky)]">
            <div>
              <p className="font-semibold">
                {docs.length} {docs.length === 1 ? "document" : "documents"}
              </p>
              <p className="text-muted">
                {owned} yours · {shared} shared with you
              </p>
            </div>
            <p className="flex items-center gap-3 text-muted">
              <span className="size-2.5 rounded-full bg-[#6f7f3d] ring-4 ring-sage/40" />
              Last edit {timeAgo(docs[0].updatedAt)}
            </p>
          </section>
        )}

        <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
          <h2 className="eyebrow">Recent documents</h2>
          <span className="text-sm text-muted">{docs.length} total</span>
        </div>

        {loadError && <p role="alert" className="alert-error mb-6">{loadError}</p>}

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse border border-line bg-surface" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center border border-dashed border-ink/30 bg-surface px-6 py-20 text-center">
            <div className="mb-5 flex size-14 items-center justify-center bg-sage text-[#0d1821]">
              <FileText className="size-7" />
            </div>
            <h3 className="font-serif text-3xl tracking-tight">No documents yet</h3>
            <p className="mt-2 max-w-sm text-muted">
              Create your first document and invite others to write with you in real time.
            </p>
            <Button onClick={() => void create()} loading={busy} className="mt-8">
              <Plus className="size-4" /> New document
            </Button>
          </div>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc, i) => (
              <li
                key={doc.id}
                className="group relative flex flex-col border border-line bg-surface transition duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--sky)]"
              >
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="eyebrow text-muted">{String(i + 1).padStart(2, "0")}</span>
                  {doc.role === "owner" && (
                    <DocMenu
                      disabled={busy}
                      onRename={() => setRenaming(doc)}
                      onDelete={() => setDeleting(doc)}
                    />
                  )}
                </div>

                <div className="p-5">
                  <div
                    aria-hidden
                    className="-rotate-1 space-y-2.5 border border-line bg-paper p-5 transition-colors group-hover:bg-sky/40"
                  >
                    <div className="h-1.5 w-11/12 bg-ink/20" />
                    <div className="h-1.5 w-8/12 bg-ink/20" />
                    <div className="h-1.5 w-10/12 bg-ink/20" />
                    <div className="h-1.5 w-5/12 bg-ink/20" />
                  </div>

                  <Link
                    to={`/documents/${doc.id}`}
                    className="mt-6 line-clamp-2 block font-serif text-3xl leading-tight tracking-tight after:absolute after:inset-0"
                  >
                    {doc.title}
                  </Link>
                  <p
                    className="mt-3 flex items-center gap-2 text-sm text-muted"
                    title={new Date(doc.updatedAt).toLocaleString()}
                  >
                    <Clock className="size-4" /> Edited {timeAgo(doc.updatedAt)}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between px-5 pb-5">
                  <RoleBadge role={doc.role} />
                  <span className="flex items-center gap-1 text-sm font-semibold">
                    Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <RenameDialog
        open={renaming !== null}
        currentTitle={renaming?.title ?? ""}
        busy={busy}
        onSubmit={(t) => void submitRename(t)}
        onCancel={() => setRenaming(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete document?"
        message={`"${deleting?.title ?? ""}" will be deleted for everyone who has access. This can't be undone.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}