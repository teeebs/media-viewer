import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./components/Layout/Header";
import { TagFilter } from "./components/TagFilter/TagFilter";
import { VideoGrid } from "./components/VideoGrid/VideoGrid";
import { VideoModal } from "./components/VideoGrid/VideoModal";
import type { VideoSummary } from "./types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function AppContent() {
  const [selectedVideo, setSelectedVideo] = useState<VideoSummary | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Header />
      <TagFilter />
      <main className="max-w-screen-2xl mx-auto">
        <VideoGrid onVideoClick={setSelectedVideo} />
      </main>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
