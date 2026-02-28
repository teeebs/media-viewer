import { useCallback } from "react";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { useVideos } from "../../hooks/useVideos";
import type { VideoSummary } from "../../types";
import { VideoCard } from "./VideoCard";

interface VideoGridProps {
  onVideoClick: (video: VideoSummary) => void;
}

export function VideoGrid({ onVideoClick }: VideoGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useVideos();

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useIntersectionObserver(loadMore, { rootMargin: "200px" });

  const allVideos = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse aspect-video"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 dark:text-red-400">
        Failed to load videos. Is the backend running?
      </div>
    );
  }

  if (allVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 gap-2">
        <span className="text-4xl">&#127916;</span>
        <p>No videos found. Try adjusting your filters or run a rescan.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-4">
        {allVideos.map((video) => (
          <VideoCard key={video.id} video={video} onClick={() => onVideoClick(video)} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
