import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { useAuth } from "../auth/auth-context";
import { ApiError } from "../lib/api";
import { Field } from "../components/Field";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "UNKNOWN", "Something went wrong"));
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Log in to Cowrite</h1>
      <form onSubmit={onSubmit}>
        {error && !error.fields && <p className="form-error">{error.message}</p>}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.fields?.email}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.fields?.password}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p>
        No account? <Link to="/register" state={location.state}>Register</Link>
      </p>
    </main>
  );
}