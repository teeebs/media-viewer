from sqlalchemy import (
    Boolean, Column, Float, ForeignKey, Index, Integer, Text,
    func, text,
)
from sqlalchemy.orm import relationship

from .database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Text, primary_key=True)
    folder_name = Column(Text, nullable=False, unique=True)
    title = Column(Text)
    description = Column(Text)
    uploader = Column(Text)
    uploader_url = Column(Text)
    webpage_url = Column(Text)
    thumbnail = Column(Text)
    duration = Column(Float)
    width = Column(Integer)
    height = Column(Integer)
    aspect_ratio = Column(Float)
    like_count = Column(Integer)
    repost_count = Column(Integer)
    comment_count = Column(Integer)
    extractor = Column(Text)
    post_timestamp = Column(Integer)
    epoch = Column(Integer)
    is_available = Column(Boolean, nullable=False, default=True)
    created_at = Column(Text, nullable=False, server_default=func.datetime("now"))
    updated_at = Column(Text, nullable=False, server_default=func.datetime("now"), onupdate=func.datetime("now"))

    tags = relationship("Tag", secondary="video_tags", back_populates="videos")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

    videos = relationship("Video", secondary="video_tags", back_populates="tags")


class VideoTag(Base):
    __tablename__ = "video_tags"

    video_id = Column(Text, ForeignKey("videos.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)


# Indexes
Index("idx_videos_epoch", Video.epoch.desc())
Index("idx_videos_available", Video.is_available)
Index("idx_video_tags_video", VideoTag.video_id)
Index("idx_video_tags_tag", VideoTag.tag_id)
