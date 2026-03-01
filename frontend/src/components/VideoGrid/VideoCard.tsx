import { useState } from "react";
import { useFilterStore } from "../../store/filterStore";
import type { VideoSummary } from "../../types";

interface VideoCardProps {
  video: VideoSummary;
  onClick: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const [thumbError, setThumbError] = useState(false);
  const addTag = useFilterStore((s) => s.addTag);

  return (
    <div className="group rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-lg transition-shadow flex flex-col">
      {/* Thumbnail */}
      <div
        className="relative cursor-pointer bg-gray-900 aspect-video overflow-hidden"
        onClick={onClick}
      >
        {video.thumbnail && !thumbError ? (
          <img
            src={video.thumbnail}
            alt={video.title ?? ""}
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg
              className="w-12 h-12 opacity-40"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        {video.duration != null && (
          <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1 py-0.5 rounded">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Unavailable overlay */}
        {!video.is_available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-medium">
            Unavailable
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Title */}
        <p
          className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
          onClick={onClick}
          title={video.title ?? undefined}
        >
          {video.title ?? "Untitled"}
        </p>

        {/* Tags */}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
