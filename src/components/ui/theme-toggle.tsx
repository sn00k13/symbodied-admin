"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="h-10 w-10 flex items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 dark:text-[#89a895] dark:hover:bg-[#1b2d20] transition-colors duration-200"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
