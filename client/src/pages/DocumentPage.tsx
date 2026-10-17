import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api, ApiError } from "../lib/api";
import type { DocumentSummary } from "../types";
import { Editor } from "../components/Editor";

export function DocumentPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ document: DocumentSummary }>(`/documents/${encodeURIComponent(id ?? "")}`)
      .then((d) => {
        if (!cancelled) setDoc(d.document);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
          <Editor documentId={doc.id} editable={doc.role !== "viewer"} />
        </>
      )}
    </main>
  );
}