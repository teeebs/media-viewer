# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend with embedded frontend
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app/ ./app/

# Embed the compiled React app
COPY --from=frontend-build /app/frontend/dist ./static

# Persistent data directory for SQLite
RUN mkdir -p /data

ENV VIDEO_DIR=/videos
ENV DATABASE_URL=sqlite:////data/media.db
ENV PORT=8000
ENV SCAN_ON_STARTUP=true

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
