"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { buttonVariants } from "src/components/ui/button";
import { layoutLabels } from "src/lib/constants/layout";
import { cn } from "src/lib/shared/utils";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={layoutLabels.themeToggle}
      onClick={() => setTheme(nextTheme)}
      className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
