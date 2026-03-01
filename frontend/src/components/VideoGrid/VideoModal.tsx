import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { VideoSummary } from "../../types";
import { TagEditor } from "../TagEditor/TagEditor";
import { useFilterStore } from "../../store/filterStore";

interface VideoModalProps {
  video: VideoSummary;
  onClose: () => void;
}

export function VideoModal({ video, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();
  const addFilterTag = useFilterStore((s) => s.addTag);

  // Local tag state (kept in sync with the server)
  const [tags, setTags] = useState<string[]>(video.tags);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Pause video on unmount
  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  const handleAddTag = async (name: string) => {
    const result = await api.addTag(video.id, name);
    setTags(result.tags);
    queryClient.invalidateQueries({ queryKey: ["videos"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };

  const handleRemoveTag = async (tagName: string) => {
    // Look up the tag id from the tags endpoint
    const allTags = await api.getTags(tagName);
    const tag = allTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (!tag) return;
    const result = await api.removeTag(video.id, tag.id);
    setTags(result.tags);
    queryClient.invalidateQueries({ queryKey: ["videos"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-white/80 dark:bg-gray-800/80 rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >
          &#x2715;
        </button>

        {/* Video player */}
        <div className="bg-black rounded-t-xl overflow-hidden">
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full max-h-[60vh] object-contain"
            src={`/api/videos/${video.id}/stream`}
          />
        </div>

        {/* Details */}
        <div className="p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {video.title ?? "Untitled"}
          </h2>

          {/* Tags */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Tags
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full"
                >
                  <button
                    onClick={() => addFilterTag(tag)}
                    className="hover:underline"
                  >
                    {tag}
                  </button>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-400 hover:text-red-500 ml-1 leading-none"
                    aria-label={`Remove tag ${tag}`}
                  >
                    &#x2715;
                  </button>
                </span>
              ))}
            </div>
            <TagEditor videoId={video.id} onAdd={handleAddTag} />
          </div>

          {video.webpage_url && (
            <a
              href={video.webpage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-500 truncate"
            >
              View original source &#8599;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
