import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useFilterStore } from "../store/filterStore";

export function useVideos() {
  const { activeTags, sortOrder } = useFilterStore();

  return useInfiniteQuery({
    queryKey: ["videos", { sort: sortOrder, tags: activeTags }],
    queryFn: ({ pageParam }) =>
      api.getVideos({
        page: pageParam as number,
        page_size: 24,
        sort: sortOrder,
        tags: activeTags.length > 0 ? activeTags : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.has_next ? lastPage.page + 1 : undefined,
  });
}
