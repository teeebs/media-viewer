import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { SortControl } from "../Controls/SortControl";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return [dark, setDark] as const;
}

export function Header() {
  const [dark, setDark] = useDarkMode();
  const [scanning, setScanning] = useState(false);

  const handleRescan = async () => {
    setScanning(true);
    try {
      await api.rescan();
      window.location.reload();
    } finally {
      setScanning(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo / title */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            &#127916; Media Viewer
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <SortControl />

          <button
            onClick={handleRescan}
            disabled={scanning}
            title="Rescan video directory"
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {scanning ? "Scanning..." : "🔄 Rescan"}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}
