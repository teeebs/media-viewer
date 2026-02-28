import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import type { Tag } from "../../types";

interface TagEditorProps {
  videoId: string;
  onAdd: (name: string) => Promise<void>;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function TagEditor({ videoId, onAdd }: TagEditorProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedInput = useDebounce(input, 200);

  // Fetch suggestions when input changes
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    api.getTags(debouncedInput, 10).then((tags) => {
      setSuggestions(tags);
      setOpen(true);
      setActiveIndex(-1);
    });
  }, [debouncedInput]);

  const submit = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onAdd(trimmed);
      setInput("");
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "Enter") submit(input);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        submit(suggestions[activeIndex].name);
      } else {
        submit(input);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // The extra option shown at the bottom when the input doesn't exactly match any suggestion
  const showCreate =
    input.trim() &&
    !suggestions.some((t) => t.name.toLowerCase() === input.trim().toLowerCase());

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Add a tag..."
          disabled={loading}
          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={() => submit(input)}
          disabled={!input.trim() || loading}
          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>

      {open && (suggestions.length > 0 || showCreate) && (
        <ul className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((tag, i) => (
            <li
              key={tag.id}
              onMouseDown={() => submit(tag.name)}
              className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer ${
                i === activeIndex
                  ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              }`}
            >
              <span>{tag.name}</span>
              <span className="text-xs text-gray-400">{tag.video_count}</span>
            </li>
          ))}
          {showCreate && (
            <li
              onMouseDown={() => submit(input.trim())}
              className={`px-3 py-2 text-sm cursor-pointer border-t border-gray-100 dark:border-gray-700 ${
                activeIndex === suggestions.length
                  ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              Create tag: <strong>{input.trim()}</strong>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
