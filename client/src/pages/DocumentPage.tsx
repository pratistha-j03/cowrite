import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api, ApiError } from "../lib/api";
import type { DocumentSummary } from "../types";
import { Editor } from "../components/Editor";
import { ShareDialog } from "../components/ShareDialog";

export function DocumentPage() {
  const { id = "" } = useParams();
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchDoc = useCallback(() => {
    return api<{ document: DocumentSummary }>(`/documents/${encodeURIComponent(id)}`);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetchDoc()
      .then((d) => {
        if (!cancelled) setDoc(d.document);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDoc]);

  const refresh = useCallback(() => {
    fetchDoc()
      .then((d) => {
        setDoc(d.document);
        setError(null);
      })
      .catch((err) => {
        setDoc(null);
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      });
  }, [fetchDoc]);

  return (
    <main className="dashboard">
      <p>
        <Link to="/">← All documents</Link>
      </p>
      {error && <p className="form-error">{error}</p>}
      {!error && !doc && <p>Loading…</p>}
      {doc && (
        <>
          <h1>{doc.title}</h1>
          <p><small>Your role: {doc.role}</small></p>
          {doc.role === "owner" && <ShareDialog documentId={doc.id} />}
          <Editor documentId={doc.id} editable={doc.role !== "viewer"} onAccessChange={refresh} />
        </>
      )}
    </main>
  );
}