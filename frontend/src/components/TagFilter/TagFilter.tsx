import { useFilterStore } from "../../store/filterStore";
import { TagChip } from "./TagChip";

export function TagFilter() {
  const { activeTags, removeTag, clearTags } = useFilterStore();

  if (activeTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
        Filtering by:
      </span>
      {activeTags.map((tag) => (
        <TagChip key={tag} name={tag} onRemove={() => removeTag(tag)} />
      ))}
      <button
        onClick={clearTags}
        className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
