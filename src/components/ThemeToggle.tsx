import { Moon, Sun, Palette } from "lucide-react";
import { useMuscalStore } from "@/store/useMuscalStore";
import { auditLogger } from "@/lib/AuditLogger";
import { motion } from "motion/react";
import { AKIRA_THEMES } from "@/lib/themeEngine";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const { akiraTheme, toggleTheme } = useMuscalStore();

  const current = AKIRA_THEMES.find(t => t.id === akiraTheme) || AKIRA_THEMES[0];
  const isDark = current.mode === "dark";

  const handleToggle = () => {
    toggleTheme();
    const nextTheme = isDark ? "LIGHT" : "DARK";
    auditLogger.log({
      category: "SYSTEM",
      severity: "INFO",
      action: "THEME_TOGGLED",
      description: `User toggled visual theme to ${nextTheme}`,
      actor: "USER",
      metadata: { newTheme: nextTheme }
    });
  };

  return (
    <button
      onClick={handleToggle}
      id="theme-toggle-btn"
      type="button"
      className={`relative inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]/70 backdrop-blur-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-neon)] transition-all duration-300 shadow-sm group ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Akira Cyberpunk Dark Mode"}
      aria-label="Toggle visual theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            rotate: isDark ? 0 : 90,
            opacity: isDark ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center text-[var(--accent-neon)]"
        >
          <Moon className="w-3.5 h-3.5" />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            rotate: isDark ? -90 : 0,
            opacity: isDark ? 0 : 1
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center text-amber-500"
        >
          <Sun className="w-3.5 h-3.5" />
        </motion.div>
      </div>

      {showLabel && (
        <span className="text-xs font-mono tracking-wider font-semibold uppercase">
          {isDark ? current.name : "Light Mode"}
        </span>
      )}
    </button>
  );
}
