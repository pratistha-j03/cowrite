import { useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../types";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Who am I? A 401 here just means "not logged in".
  useEffect(() => {
    let cancelled = false;
    api<{ user: User }>("/auth/me")
      .then((d) => {
        if (!cancelled) setUser(d.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const d = await api<{ user: User }>("/auth/login", { method: "POST", body: { email, password } });
    setUser(d.user);
  }

  async function register(name: string, email: string, password: string) {
    const d = await api<{ user: User }>("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    setUser(d.user);
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}