# ── Stage 1: Frontend Builder ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app
# We copy frontend files into /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --production=false
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_URL=http://localhost:8000
RUN npm run build

# ── Stage 2: Final Runner ──────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (Node.js, supervisor, git, build tools)
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    git \
    build-essential \
    libxml2-dev \
    libxslt-dev \
    libffi-dev \
    libssl-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install SearxNG
RUN git clone https://github.com/searxng/searxng.git /usr/local/searxng \
    && cd /usr/local/searxng \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -e .

# Install FastAPI Backend Dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy Backend Application
COPY backend/ /app/backend/

# Copy Frontend Standalone App (Next.js thinks it's in /app)
COPY --from=frontend-builder /app/public /app/frontend/public
COPY --from=frontend-builder /app/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/.next/static /app/frontend/.next/static

# Copy SearxNG Settings
RUN mkdir -p /app/searxng
COPY searxng/settings.yml /app/searxng/settings.yml
COPY searxng/limiter.toml /app/searxng/limiter.toml

# Copy Supervisord Configuration
COPY supervisord.conf /app/supervisord.conf

# Prepare permissions for Hugging Face (User 1000)
# Create required directories for supervisor
RUN mkdir -p /var/log/supervisor /var/run /app/searxng-data \
    && useradd -m -u 1000 hfuser \
    && chown -R 1000:1000 /app /var/log/supervisor /var/run /usr/local/searxng /app/searxng-data \
    && chmod -R 777 /app /var/log/supervisor /var/run /usr/local/searxng /app/searxng-data /app/searxng

USER 1000

# Set Environment Variables
ENV SEARXNG_SETTINGS_PATH=/app/searxng/settings.yml
ENV SEARXNG_BASE_URL=http://localhost:8888
ENV BACKEND_URL=http://localhost:8000
ENV FRONTEND_URL=*
ENV SARVAM_API_KEY=""
ENV PORT=3000

EXPOSE 3000 8000 8888

CMD ["supervisord", "-c", "/app/supervisord.conf"]
