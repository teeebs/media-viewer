from typing import Optional
from pydantic import BaseModel


class TagOut(BaseModel):
    id: int
    name: str
    video_count: int = 0

    class Config:
        from_attributes = True


class VideoSummary(BaseModel):
    id: str
    folder_name: str
    title: Optional[str] = None
    uploader: Optional[str] = None
    uploader_url: Optional[str] = None
    webpage_url: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    aspect_ratio: Optional[float] = None
    like_count: Optional[int] = None
    repost_count: Optional[int] = None
    comment_count: Optional[int] = None
    extractor: Optional[str] = None
    post_timestamp: Optional[int] = None
    epoch: Optional[int] = None
    is_available: bool
    tags: list[str] = []

    class Config:
        from_attributes = True


class VideoDetail(VideoSummary):
    description: Optional[str] = None


class VideoListResponse(BaseModel):
    items: list[VideoSummary]
    total: int
    page: int
    page_size: int
    has_next: bool


class TagAddRequest(BaseModel):
    name: str


class ScanResult(BaseModel):
    added: int
    updated: int
    marked_unavailable: int
    total: int
    duration_seconds: float


class AdminStatus(BaseModel):
    total_videos: int
    available_videos: int
    total_tags: int
    video_dir: str
    database_url: str
