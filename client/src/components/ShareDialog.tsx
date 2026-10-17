import { useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import type { Member } from "../types";
import { Field } from "./Field";

type ShareRole = "editor" | "viewer";

export function ShareDialog({ documentId }: { documentId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const base = `/documents/${encodeURIComponent(documentId)}`;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  function openDialog() {
    setError(null);
    setLoading(true);
    ref.current?.showModal();
    api<{ members: Member[] }>(`${base}/members`)
      .then((d) => setMembers(d.members))
      .catch((e) => setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong")))
      .finally(() => setLoading(false));
  }

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong"));
    } finally {
      setBusy(false);
    }
  }

  function add(e: FormEvent) {
    e.preventDefault();
    void run(async () => {
      const d = await api<{ member: Member }>(`${base}/share`, { method: "POST", body: { email, role } });
      setMembers((prev) => [...prev, d.member]);
      setEmail("");
    });
  }

  function changeRole(m: Member, next: ShareRole) {
    void run(async () => {
      const d = await api<{ member: Member }>(`${base}/members/${m.id}`, {
        method: "PATCH",
        body: { role: next },
      });
      setMembers((prev) => prev.map((x) => (x.id === m.id ? d.member : x)));
    });
  }

  function remove(m: Member) {
    if (!window.confirm(`Remove ${m.name}'s access?`)) return;
    void run(async () => {
      await api(`${base}/members/${m.id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    });
  }

  return (
    <>
      <button type="button" onClick={openDialog}>Share</button>

      <dialog
        ref={ref}
        className="share-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) ref.current?.close(); // backdrop click
        }}
      >
        <div className="share-body">
          <h2>Share document</h2>

          <form onSubmit={add} className="share-form">
            <Field
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error?.fields?.email}
            />
            <label className="field">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as ShareRole)}>
                <option value="editor">Editor (can edit)</option>
                <option value="viewer">Viewer (read only)</option>
              </select>
            </label>
            <button type="submit" disabled={busy}>Add</button>
          </form>

          {error && !error.fields && <p className="form-error">{error.message}</p>}

          <h3>People with access</h3>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <ul className="member-list">
              {members.map((m) => (
                <li key={m.id} className="member-row">
                  <div>
                    {m.name}
                    <small> · {m.email}</small>
                  </div>
                  {m.role === "owner" ? (
                    <small>Owner</small>
                  ) : (
                    <div>
                      <select
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => changeRole(m, e.target.value as ShareRole)}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>{" "}
                      <button type="button" disabled={busy} onClick={() => remove(m)}>
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <button type="button" onClick={() => ref.current?.close()}>Close</button>
        </div>
      </dialog>
    </>
  );
}