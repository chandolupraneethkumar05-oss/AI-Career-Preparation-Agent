# ==============================================================================
# Unified Production Dockerfile for AI Career Preparation Agent
# All-In-One Deployment: Multi-Stage Node 20 Build + Python 3.13 FastAPI Runtime
# ==============================================================================

# Stage 1: Build React/Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Python Backend
FROM python:3.13-slim AS runner
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PYTHONPATH=/app:/app/backend \
    DATABASE_URL=sqlite:////app/data/career_agent.db \
    RECORDINGS_STORAGE_DIR=/app/storage/recordings \
    HF_HOME=/app/.cache/huggingface \
    SENTENCE_TRANSFORMERS_HOME=/app/.cache/sentence_transformers

# Install system dependencies (curl for health check, ffmpeg for audio transcription)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged application user
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/sh -m appuser

# Create necessary persistent and cache directories
RUN mkdir -p /app/data \
             /app/storage/recordings \
             /app/.cache/huggingface \
             /app/.cache/sentence_transformers && \
    chown -R appuser:appgroup /app

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application source
COPY backend/ ./backend/

# Copy compiled frontend dist from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Set permissions
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start production server with uvicorn (single worker for SQLite lock safety)
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
