export interface Tag {
  id: number;
  name: string;
  video_count: number;
}

export interface VideoSummary {
  id: string;
  folder_name: string;
  title: string | null;
  uploader: string | null;
  uploader_url: string | null;
  webpage_url: string | null;
  thumbnail: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  aspect_ratio: number | null;
  like_count: number | null;
  repost_count: number | null;
  comment_count: number | null;
  extractor: string | null;
  post_timestamp: number | null;
  epoch: number | null;
  is_available: boolean;
  tags: string[];
}

export interface VideoDetail extends VideoSummary {
  description: string | null;
}

export interface VideoListResponse {
  items: VideoSummary[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export type SortOrder = "epoch_desc" | "epoch_asc";
