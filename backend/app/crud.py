from pathlib import Path
from typing import Literal, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import settings
from .models import Tag, Video, VideoTag
from .scanner import _add_tag_to_video, _get_or_create_tag


SortOrder = Literal["epoch_desc", "epoch_asc"]


# ---------------------------------------------------------------------------
# Videos
# ---------------------------------------------------------------------------

def get_videos(
    db: Session,
    page: int = 1,
    page_size: int = 24,
    sort: SortOrder = "epoch_desc",
    tags: list[str] | None = None,
    available_only: bool = True,
) -> tuple[list[Video], int]:
    q = db.query(Video)

    if available_only:
        q = q.filter(Video.is_available == True)  # noqa: E712

    if tags:
        for tag_name in tags:
            tag = db.query(Tag).filter(Tag.name.ilike(tag_name)).first()
            if tag:
                q = q.filter(Video.tags.any(Tag.id == tag.id))
            else:
                # Tag doesn't exist → no results
                return [], 0

    if sort == "epoch_desc":
        q = q.order_by(Video.epoch.desc().nullslast())
    else:
        q = q.order_by(Video.epoch.asc().nullsfirst())

    total = q.count()
    offset = (page - 1) * page_size
    items = q.offset(offset).limit(page_size).all()
    return items, total


def get_video(db: Session, video_id: str) -> Optional[Video]:
    return db.query(Video).filter_by(id=video_id).first()


def get_video_tags(db: Session, video_id: str) -> list[str]:
    video = get_video(db, video_id)
    if not video:
        return []
    return [t.name for t in video.tags]


def resolve_video_file(video: Video) -> Optional[Path]:
    """Return the actual .mp4 path for a video, or None if not found."""
    folder = Path(settings.video_dir) / video.folder_name
    mp4_files = list(folder.glob("*.mp4"))
    return mp4_files[0] if mp4_files else None


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

def get_tags(db: Session, q: Optional[str] = None, limit: int = 50) -> list[dict]:
    usage_count = (
        select(func.count(VideoTag.video_id))
        .where(VideoTag.tag_id == Tag.id)
        .correlate(Tag)
        .scalar_subquery()
    )

    query = db.query(Tag, usage_count.label("video_count"))

    if q:
        query = query.filter(Tag.name.ilike(f"{q}%"))

    query = query.order_by(usage_count.desc(), Tag.name)
    query = query.limit(limit)

    return [
        {"id": tag.id, "name": tag.name, "video_count": count or 0}
        for tag, count in query.all()
    ]


def add_tag_to_video(db: Session, video_id: str, tag_name: str) -> list[str]:
    video = get_video(db, video_id)
    if not video:
        return []
    _add_tag_to_video(db, video_id, tag_name.strip())
    db.commit()
    db.refresh(video)
    return [t.name for t in video.tags]


def remove_tag_from_video(db: Session, video_id: str, tag_id: int) -> list[str]:
    video = get_video(db, video_id)
    if not video:
        return []
    vt = db.query(VideoTag).filter_by(video_id=video_id, tag_id=tag_id).first()
    if vt:
        db.delete(vt)
        db.commit()
    db.refresh(video)
    return [t.name for t in video.tags]


# ---------------------------------------------------------------------------
# Admin stats
# ---------------------------------------------------------------------------

def get_status(db: Session) -> dict:
    total = db.query(Video).count()
    available = db.query(Video).filter_by(is_available=True).count()
    tag_count = db.query(Tag).count()
    return {
        "total_videos": total,
        "available_videos": available,
        "total_tags": tag_count,
        "video_dir": settings.video_dir,
        "database_url": settings.database_url,
    }
