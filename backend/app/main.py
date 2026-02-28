import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import create_tables
from .routers import admin, tags, videos
from .scanner import scan_videos_async

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    if settings.scan_on_startup:
        logger.info("Running startup scan...")
        await scan_videos_async()
    yield


app = FastAPI(title="Media Viewer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Must be last: serve React SPA (html=True enables index.html fallback)
try:
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
except RuntimeError:
    logger.warning("No 'static' directory found — skipping frontend mount (dev mode)")
