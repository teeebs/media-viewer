import type { SortOrder, Tag, VideoDetail, VideoListResponse } from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getVideos(params: {
    page: number;
    page_size?: number;
    sort?: SortOrder;
    tags?: string[];
    available_only?: boolean;
  }): Promise<VideoListResponse> {
    const q = new URLSearchParams();
    q.set("page", String(params.page));
    if (params.page_size) q.set("page_size", String(params.page_size));
    if (params.sort) q.set("sort", params.sort);
    if (params.tags) params.tags.forEach((t) => q.append("tags", t));
    if (params.available_only !== undefined)
      q.set("available_only", String(params.available_only));
    return request<VideoListResponse>(`/videos?${q.toString()}`);
  },

  getVideo(id: string): Promise<VideoDetail> {
    return request<VideoDetail>(`/videos/${id}`);
  },

  getTags(q?: string, limit?: number): Promise<Tag[]> {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (limit) params.set("limit", String(limit));
    return request<Tag[]>(`/tags?${params.toString()}`);
  },

  addTag(videoId: string, name: string): Promise<{ tags: string[] }> {
    return request<{ tags: string[] }>(`/videos/${videoId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  },

  removeTag(videoId: string, tagId: number): Promise<{ tags: string[] }> {
    return request<{ tags: string[] }>(`/videos/${videoId}/tags/${tagId}`, {
      method: "DELETE",
    });
  },

  rescan(): Promise<unknown> {
    return request("/admin/rescan", { method: "POST" });
  },
};
