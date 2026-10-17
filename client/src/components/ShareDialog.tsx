import { useRef, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { Member } from "../types";
import { Field } from "./Field";
import { Button } from "./ui/Button";
import { useToast } from "./toast/toast-context";

type ShareRole = "editor" | "viewer";

const select =
  "border border-ink/30 bg-surface px-2 py-2 text-sm outline-none focus:border-ink disabled:opacity-60";

export function ShareDialog({ documentId }: { documentId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const base = `/documents/${encodeURIComponent(documentId)}`;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const toError = (e: unknown) =>
    e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong");

  function openDialog() {
    setError(null);
    setLoading(true);
    ref.current?.showModal();
    api<{ members: Member[] }>(`${base}/members`)
      .then((d) => setMembers(d.members))
      .catch((e) => setError(toError(e)))
      .finally(() => setLoading(false));
  }

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(toError(e));
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
      toast.show("success", `Shared with ${d.member.name}`);
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
    void run(async () => {
      await api(`${base}/members/${m.id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    });
  }

  return (
    <>
      <Button onClick={openDialog}>
        <UserPlus className="size-4" /> Share
      </Button>

      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
        className="m-auto w-[min(34rem,92vw)] border border-ink bg-surface p-0 text-ink shadow-[10px_10px_0_var(--sky)] backdrop:bg-black/50"
      >
        <div className="p-6">
          <h2 className="font-serif text-3xl tracking-tight">Share document</h2>

          <form onSubmit={add} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <Field
                label="Email"
                type="email"
                required
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error?.fields?.email}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="share-role" className="eyebrow block text-muted">
                Role
              </label>
              <select
                id="share-role"
                value={role}
                onChange={(e) => setRole(e.target.value as ShareRole)}
                className={`${select} w-full py-2.5`}
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <Button type="submit" loading={busy} className="sm:mt-[26px]">
              Add
            </Button>
          </form>

          {error && !error.fields && <p className="alert-error mt-3">{error.message}</p>}

          <h3 className="eyebrow mb-1 mt-8 text-muted">People with access</h3>
          {loading ? (
            <p className="py-3 text-sm text-muted">Loading…</p>
          ) : (
            <ul className="divide-y divide-line">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center bg-sky text-xs font-bold uppercase text-ink">
                      {m.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{m.name}</p>
                      <p className="truncate text-xs text-muted">{m.email}</p>
                    </div>
                  </div>
                  {m.role === "owner" ? (
                    <span className="eyebrow text-muted">Owner</span>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        aria-label={`Role for ${m.name}`}
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => changeRole(m, e.target.value as ShareRole)}
                        className={select}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <Button variant="ghost" disabled={busy} onClick={() => remove(m)}>
                        Remove
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={() => ref.current?.close()}>
              Done
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}