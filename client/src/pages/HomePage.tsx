import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/auth-context";
import { api, ApiError } from "../lib/api";
import type { DocumentSummary } from "../types";

function messageOf(err: unknown) {
  return err instanceof ApiError ? err.message : "Something went wrong";
}

export function HomePage() {
  const { user, logout } = useAuth();
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ documents: DocumentSummary[] }>("/documents")
      .then((d) => {
        if (!cancelled) setDocs(d.documents);
      })
      .catch((err) => {
        if (!cancelled) setError(messageOf(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  function create() {
    return run(async () => {
      const d = await api<{ document: DocumentSummary }>("/documents", { method: "POST" });
      setDocs((prev) => [d.document, ...prev]);
    });
  }

  function rename(doc: DocumentSummary) {
    const title = window.prompt("New title", doc.title)?.trim();
    if (!title || title === doc.title) return;
    return run(async () => {
      const d = await api<{ document: DocumentSummary }>(`/documents/${doc.id}`, {
        method: "PATCH",
        body: { title },
      });
      setDocs((prev) => [d.document, ...prev.filter((x) => x.id !== doc.id)]);
    });
  }

  function remove(doc: DocumentSummary) {
    if (!window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    return run(async () => {
      await api(`/documents/${doc.id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((x) => x.id !== doc.id));
    });
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Your documents</h1>
        <div>
          <span>{user?.name}</span>{" "}
          <button onClick={() => void logout()}>Log out</button>
        </div>
      </header>

      <button onClick={() => void create()} disabled={busy}>
        New document
      </button>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : docs.length === 0 ? (
        <p>No documents yet. Create your first one.</p>
      ) : (
        <ul className="doc-list">
          {docs.map((doc) => (
            <li key={doc.id} className="doc-row">
              <div>
                <Link to={`/documents/${doc.id}`}>{doc.title}</Link>
                <small>
                  {" "}
                  · {doc.role} · updated {new Date(doc.updatedAt).toLocaleString()}
                </small>
              </div>
              {doc.role === "owner" && (
                <div>
                  <button onClick={() => void rename(doc)} disabled={busy}>
                    Rename
                  </button>{" "}
                  <button onClick={() => void remove(doc)} disabled={busy}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}