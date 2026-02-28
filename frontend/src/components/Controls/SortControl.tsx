import { useFilterStore } from "../../store/filterStore";
import type { SortOrder } from "../../types";

export function SortControl() {
  const { sortOrder, setSortOrder } = useFilterStore();

  return (
    <select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
      className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="epoch_desc">Newest first</option>
      <option value="epoch_asc">Oldest first</option>
    </select>
  );
}
