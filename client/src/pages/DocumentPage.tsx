import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, FileX, Pencil } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { AppHeader } from "../components/AppHeader";
import { Editor } from "../components/Editor";
import { RoleBadge } from "../components/RoleBadge";
import { ShareDialog } from "../components/ShareDialog";
import { RenameDialog } from "../components/ui/RenameDialog";
import { useToast } from "../components/toast/toast-context";
import type { DocumentSummary } from "../types";
import { timeAgo } from "../lib/time";

function messageOf(err: unknown) {
  return err instanceof ApiError ? err.message : "Something went wrong";
}

export function DocumentPage() {
  const { id = "" } = useParams();
  const toast = useToast();
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState(false);

  const docRef = useRef<DocumentSummary | null>(null);
  useEffect(() => {
    docRef.current = doc;
  });

  const fetchDoc = useCallback(
    () => api<{ document: DocumentSummary }>(`/documents/${encodeURIComponent(id)}`),
    [id],
  );

  useEffect(() => {
    let cancelled = false;
    fetchDoc()
      .then((d) => {
        if (!cancelled) setDoc(d.document);
      })
      .catch((err) => {
        if (!cancelled) setError(messageOf(err));
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDoc]);

  // Re-check my access after a reconnect or denial. A 404 unmounts the editor.
  const refresh = useCallback(() => {
    fetchDoc()
      .then((d) => {
        const before = docRef.current?.role;
        if (before && before !== d.document.role) {
          toast.show("info", `Your access changed to ${d.document.role}`);
        }
        setDoc(d.document);
        setError(null);
      })
      .catch((err) => {
        setDoc(null);
        setError(messageOf(err));
      });
  }, [fetchDoc, toast]);

  async function submitRename(title: string) {
    setBusy(true);
    try {
      const d = await api<{ document: DocumentSummary }>(`/documents/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { title },
      });
      setDoc(d.document);
      toast.show("success", "Document renamed");
    } catch (err) {
      toast.show("error", messageOf(err));
    } finally {
      setBusy(false);
      setRenaming(false);
    }
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-8">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" /> All documents
        </Link>

        {error && (
          <div className="flex flex-col items-center border border-dashed border-ink/30 bg-surface px-6 py-20 text-center">
            <FileX className="mb-4 size-10 text-muted" />
            <h1 className="font-serif text-3xl tracking-tight">{error}</h1>
            <p className="mt-2 text-muted">It may have been deleted, or you no longer have access.</p>
          </div>
        )}

        {!error && !doc && (
          <div className="space-y-6">
            <div className="h-12 w-1/3 animate-pulse bg-line" />
            <div className="h-96 animate-pulse border border-line bg-surface" />
          </div>
        )}

        {doc && (
          <>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="truncate font-serif text-5xl tracking-tight sm:text-6xl">{doc.title}</h1>
                  {doc.role === "owner" && (
                    <button
                      type="button"
                      aria-label="Rename document"
                      title="Rename"
                      onClick={() => setRenaming(true)}
                      className="p-1.5 text-muted transition-colors hover:bg-line hover:text-ink"
                    >
                      <Pencil className="size-5" />
                    </button>
                  )}
                </div>
                <p className="mt-4 flex items-center gap-3 text-muted">
                  Last edited {timeAgo(doc.updatedAt)} <RoleBadge role={doc.role} />
                </p>
              </div>
              {doc.role === "owner" && <ShareDialog documentId={doc.id} />}
            </div>

            <Editor
              documentId={doc.id}
              editable={doc.role !== "viewer"}
              onAccessChange={refresh}
            />

            <RenameDialog
              open={renaming}
              currentTitle={doc.title}
              busy={busy}
              onSubmit={(t) => void submitRename(t)}
              onCancel={() => setRenaming(false)}
            />
          </>
        )}
      </main>
    </>
  );
}