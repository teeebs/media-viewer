import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useTags(q?: string) {
  return useQuery({
    queryKey: ["tags", q],
    queryFn: () => api.getTags(q || undefined, 50),
    staleTime: 30_000,
  });
}
