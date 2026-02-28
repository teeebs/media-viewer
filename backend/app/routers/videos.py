import asyncio
from pathlib import Path
from typing import AsyncGenerator, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import TagAddRequest, VideoDetail, VideoListResponse, VideoSummary

router = APIRouter(prefix="/videos", tags=["videos"])

CHUNK_SIZE = 64 * 1024  # 64 KB


def _video_summary(video, db: Session) -> VideoSummary:
    return VideoSummary(
        id=video.id,
        folder_name=video.folder_name,
        title=video.title,
        uploader=video.uploader,
        uploader_url=video.uploader_url,
        webpage_url=video.webpage_url,
        thumbnail=video.thumbnail,
        duration=video.duration,
        width=video.width,
        height=video.height,
        aspect_ratio=video.aspect_ratio,
        like_count=video.like_count,
        repost_count=video.repost_count,
        comment_count=video.comment_count,
        extractor=video.extractor,
        post_timestamp=video.post_timestamp,
        epoch=video.epoch,
        is_available=video.is_available,
        tags=[t.name for t in video.tags],
    )


@router.get("", response_model=VideoListResponse)
def list_videos(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=200),
    sort: Literal["epoch_desc", "epoch_asc"] = "epoch_desc",
    tags: list[str] = Query(default=[]),
    available_only: bool = True,
    db: Session = Depends(get_db),
):
    items, total = crud.get_videos(
        db,
        page=page,
        page_size=page_size,
        sort=sort,
        tags=tags or None,
        available_only=available_only,
    )
    return VideoListResponse(
        items=[_video_summary(v, db) for v in items],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.get("/{video_id}", response_model=VideoDetail)
def get_video(video_id: str, db: Session = Depends(get_db)):
    video = crud.get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    summary = _video_summary(video, db)
    return VideoDetail(**summary.model_dump(), description=video.description)


def _parse_range(range_header: str, file_size: int) -> tuple[int, int]:
    """Parse 'bytes=START-END' header. Returns (start, end) inclusive."""
    try:
        unit, rng = range_header.split("=", 1)
        if unit.strip() != "bytes":
            raise ValueError
        start_str, _, end_str = rng.partition("-")
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
        end = min(end, file_size - 1)
        return start, end
    except Exception:
        return 0, file_size - 1


async def _stream_file(path: Path, start: int, end: int) -> AsyncGenerator[bytes, None]:
    loop = asyncio.get_event_loop()

    def _read_chunk(f, size):
        return f.read(size)

    with open(path, "rb") as f:
        f.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            chunk_size = min(CHUNK_SIZE, remaining)
            chunk = await loop.run_in_executor(None, _read_chunk, f, chunk_size)
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@router.get("/{video_id}/stream")
async def stream_video(video_id: str, request: Request, db: Session = Depends(get_db)):
    video = crud.get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = crud.resolve_video_file(video)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    file_size = file_path.stat().st_size
    range_header = request.headers.get("Range")

    if range_header:
        start, end = _parse_range(range_header, file_size)
        content_length = end - start + 1
        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(
            _stream_file(file_path, start, end),
            status_code=206,
            headers=headers,
        )

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(
        _stream_file(file_path, 0, file_size - 1),
        status_code=200,
        headers=headers,
    )


@router.post("/{video_id}/tags")
def add_tag(video_id: str, body: TagAddRequest, db: Session = Depends(get_db)):
    video = crud.get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if not body.name.strip():
        raise HTTPException(status_code=422, detail="Tag name cannot be empty")
    tags = crud.add_tag_to_video(db, video_id, body.name)
    return {"tags": tags}


@router.delete("/{video_id}/tags/{tag_id}")
def remove_tag(video_id: str, tag_id: int, db: Session = Depends(get_db)):
    video = crud.get_video(db, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    tags = crud.remove_tag_from_video(db, video_id, tag_id)
    return {"tags": tags}
