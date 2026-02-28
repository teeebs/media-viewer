import asyncio
import json
import logging
import time
from pathlib import Path

from sqlalchemy.orm import Session

from .config import settings
from .database import SessionLocal
from .models import Tag, Video, VideoTag

logger = logging.getLogger(__name__)

_scan_lock = asyncio.Lock()


def _get_or_create_tag(db: Session, name: str) -> Tag:
    name = name.strip()
    tag = db.query(Tag).filter(Tag.name.ilike(name)).first()
    if not tag:
        tag = Tag(name=name)
        db.add(tag)
        db.flush()
    return tag


def _add_tag_to_video(db: Session, video_id: str, tag_name: str) -> None:
    tag = _get_or_create_tag(db, tag_name)
    exists = db.query(VideoTag).filter_by(video_id=video_id, tag_id=tag.id).first()
    if not exists:
        db.add(VideoTag(video_id=video_id, tag_id=tag.id))


def _parse_metadata(json_path: Path) -> dict:
    with open(json_path, encoding="utf-8") as f:
        return json.load(f)


def _upsert_video(db: Session, folder_name: str, meta: dict) -> tuple[bool, bool]:
    """Returns (is_new, was_updated)."""
    video_id = meta.get("id") or meta.get("display_id")
    if not video_id:
        raise ValueError("No id field in metadata")

    existing = db.query(Video).filter_by(id=video_id).first()

    data = {
        "id": video_id,
        "folder_name": folder_name,
        "title": meta.get("fulltitle") or meta.get("title"),
        "description": meta.get("description"),
        "uploader": meta.get("uploader"),
        "uploader_url": meta.get("uploader_url"),
        "webpage_url": meta.get("webpage_url"),
        "thumbnail": meta.get("thumbnail"),
        "duration": meta.get("duration"),
        "width": meta.get("width"),
        "height": meta.get("height"),
        "aspect_ratio": meta.get("aspect_ratio"),
        "like_count": meta.get("like_count"),
        "repost_count": meta.get("repost_count"),
        "comment_count": meta.get("comment_count"),
        "extractor": meta.get("extractor"),
        "post_timestamp": meta.get("timestamp"),
        "epoch": meta.get("epoch"),
        "is_available": True,
    }

    if existing:
        # Update fields but don't touch tags (preserve user tags)
        for k, v in data.items():
            if k != "id":
                setattr(existing, k, v)
        db.flush()
        return False, True
    else:
        video = Video(**data)
        db.add(video)
        db.flush()

        # Import source-platform tags on first insert only
        source_tags = meta.get("tags") or []
        for tag_name in source_tags:
            if tag_name and tag_name.strip():
                _add_tag_to_video(db, video_id, tag_name)

        return True, False


def scan_videos() -> dict:
    """Scan VIDEO_DIR and sync with the database. Returns scan stats."""
    start = time.monotonic()
    video_dir = Path(settings.video_dir)

    if not video_dir.exists():
        logger.warning(f"VIDEO_DIR does not exist: {video_dir}")
        return {"added": 0, "updated": 0, "marked_unavailable": 0, "total": 0, "duration_seconds": 0.0}

    db: Session = SessionLocal()
    added = 0
    updated = 0
    seen_folders: set[str] = set()

    try:
        subdirs = [p for p in video_dir.iterdir() if p.is_dir()]

        for subdir in subdirs:
            folder_name = subdir.name
            mp4_files = list(subdir.glob("*.mp4"))
            json_files = list(subdir.glob("*.json"))

            if not mp4_files:
                logger.debug(f"Skipping {folder_name}: no .mp4 found")
                continue
            if not json_files:
                logger.debug(f"Skipping {folder_name}: no .json found")
                continue

            try:
                meta = _parse_metadata(json_files[0])
                is_new, was_updated = _upsert_video(db, folder_name, meta)
                seen_folders.add(folder_name)
                if is_new:
                    added += 1
                elif was_updated:
                    updated += 1
            except Exception as e:
                logger.warning(f"Error processing {folder_name}: {e}")
                continue

        # Mark videos whose folders were not seen as unavailable
        marked_unavailable = 0
        all_videos = db.query(Video).filter_by(is_available=True).all()
        for video in all_videos:
            if video.folder_name not in seen_folders:
                video.is_available = False
                marked_unavailable += 1

        db.commit()
        total = db.query(Video).count()

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    duration = time.monotonic() - start
    logger.info(
        f"Scan complete: added={added}, updated={updated}, "
        f"marked_unavailable={marked_unavailable}, total={total}, "
        f"duration={duration:.2f}s"
    )
    return {
        "added": added,
        "updated": updated,
        "marked_unavailable": marked_unavailable,
        "total": total,
        "duration_seconds": round(duration, 3),
    }


async def scan_videos_async() -> dict:
    """Async wrapper with lock to prevent concurrent scans."""
    async with _scan_lock:
        return await asyncio.get_event_loop().run_in_executor(None, scan_videos)
