import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import { useFilterStore } from "../../store/filterStore";
import type { Tag } from "../../types";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function TagSearch() {
  const { activeTags, addTag } = useFilterStore();
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedInput = useDebounce(input, 200);

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

  const submit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || activeTags.includes(trimmed)) return;
    addTag(trimmed);
    setInput("");
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "Enter") submit(input);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
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

  return (
    <div className="relative w-56">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search tags..."
        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((tag, i) => {
            const alreadyActive = activeTags.includes(tag.name);
            return (
              <li
                key={tag.id}
                onMouseDown={() => !alreadyActive && submit(tag.name)}
                className={`flex items-center justify-between px-3 py-2 text-sm ${
                  alreadyActive
                    ? "text-gray-400 dark:text-gray-500 cursor-default"
                    : i === activeIndex
                    ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 cursor-pointer"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer"
                }`}
              >
                <span>{tag.name}</span>
                <span className="text-xs text-gray-400">{tag.video_count}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
