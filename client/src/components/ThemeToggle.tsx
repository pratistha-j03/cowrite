import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // storage can be blocked (private mode); the toggle still works for this session
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 text-ink transition-colors hover:bg-line"
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}