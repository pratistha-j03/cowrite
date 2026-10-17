import { Link } from "react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link to="/" aria-label="Cowrite home">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <span className="mr-3 hidden text-sm text-muted sm:inline">{user?.name}</span>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Log out"
            title="Log out"
            className="p-2 text-ink transition-colors hover:bg-line"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}