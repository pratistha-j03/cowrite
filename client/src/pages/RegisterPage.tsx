import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { useAuth } from "../auth/auth-context";
import { ApiError } from "../lib/api";
import { Field } from "../components/Field";
import { Button } from "../components/ui/Button";
import { AuthLayout } from "../components/AuthLayout";

export function RegisterPage() {
  const { user, loading, register } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [name, setName] = useState("");
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
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "UNKNOWN", "Something went wrong"));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start writing with your team in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-accent underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && !error.fields && (
          <p role="alert" className="alert-error">
            {error.message}
          </p>
        )}
        <Field
          label="Name"
          autoComplete="name"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error?.fields?.name}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.fields?.email}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.fields?.password}
        />
        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}