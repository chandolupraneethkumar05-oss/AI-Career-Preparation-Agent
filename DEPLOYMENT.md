# Production Deployment Guide — AI Career Preparation Agent

This guide provides complete, production-tested instructions for packaging, configuring, and deploying the **AI Career Preparation Agent** using Docker Compose or standalone bare-metal environments.

---

## 1. System Architecture

The application is packaged as a two-tier micro-service architecture managed via Docker Compose:

```
+-----------------------------------------------------------------------+
|                              Host Browser                             |
+-----------------------------------------------------------------------+
                                    |
                            HTTP / Port 80
                                    v
+-----------------------------------------------------------------------+
|                    career_agent_frontend (Nginx Alpine)               |
|  - Serves compiled React 19 + Vite Single Page Application            |
|  - Client-side routing fallback (try_files $uri $uri/ /index.html)    |
|  - Proxies /api/ and /health to backend container                     |
+-----------------------------------------------------------------------+
                                    |
                    Docker Internal Network: career_agent_net
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    career_agent_backend (Python 3.13-slim)            |
|  - Unprivileged user (appuser:10001)                                  |
|  - FastAPI ASGI application running on Uvicorn (1 worker)            |
|  - Neural semantic evaluation & RAG knowledge base                    |
|  - Proactive practice reminder scheduler & audio transcription        |
+-----------------------------------------------------------------------+
         |                                           |
         v                                           v
+---------------------------+             +---------------------------+
|  career_agent_db_data     |             |  career_agent_recordings  |
|  SQLite Database Volume   |             |  Interview Audio / Video  |
|  (/app/data)              |             |  (/app/storage/recordings)|
+---------------------------+             +---------------------------+
```

---

## 2. Prerequisites

### Containerized Deployment (Recommended)
- **Docker Engine**: Version 24.0 or newer.
- **Docker Compose**: Version 2.20 or newer.
- **Disk Space**: At least 4 GB available (for base OS, Python wheels, and NLP model weights).
- **RAM**: At least 2 GB RAM recommended for neural sentence-transformer inference.

### Non-Containerized Local Deployment (Host Environment)
- **Python**: 3.11, 3.12, or 3.13.
- **Node.js**: 20.x, 22.x, or 24.x and `npm`.
- **FFmpeg**: (Optional, for neural speech-to-text transcription).

---

## 3. Quickstart Deployment with Docker Compose

### Step 1: Clone and Enter the Repository
```bash
git clone https://github.com/chandolupraneethkumar05-oss/AI-Career-Preparation-Agent.git
cd AI-Career-Preparation-Agent
```

### Step 2: Configure Environment Variables
Copy the template configuration file:

**Linux / macOS (Bash):**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Generate a cryptographically secure 256-bit secret key and update `.env`:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Edit `.env` to set:
- `ENVIRONMENT=production`
- `SECRET_KEY=<your-generated-key>`
- *(Optional)* `GEMINI_API_KEY=<your-gemini-key>` for cloud AI questions.

### Step 3: Build and Start Containers
Start the services in detached mode:

```bash
docker compose up -d --build
```

### Step 4: Verify Service Health
Check running container status and health probes:

```bash
docker compose ps
```

Expected output:
```
NAME                    IMAGE                         STATUS                    PORTS
career_agent_backend    ai-career-agent-backend       Up (healthy)              0.0.0.0:8000->8000/tcp
career_agent_frontend   ai-career-agent-frontend      Up (healthy)              0.0.0.0:80->80/tcp
```

Access the application in your browser:
- **Frontend Web UI**: `http://localhost/`
- **Backend API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost/health` or `http://localhost:8000/api/health`
- **Readiness Check**: `http://localhost:8000/api/ready`

---

## 4. Configuration Reference

| Variable | Default Value | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Set to `production` in live environments. Enforces $\ge 32$-char secret key. |
| `SECRET_KEY` | *(dev key)* | HMAC signing key. **Mandatory** in production. |
| `PORT` | `8000` | Port for backend Uvicorn listener. |
| `DATABASE_URL` | `sqlite:////app/data/career_agent.db` | Path to persistent SQLite database file. |
| `RECORDINGS_STORAGE_DIR` | `/app/storage/recordings` | Directory for practice session media. |
| `CORS_ORIGINS` | `http://localhost,...` | Comma-separated list of allowed frontend origins. |
| `LLM_PROVIDER` | `""` (local) | AI provider: `gemini`, `openai`, or empty for local taxonomy. |
| `GEMINI_API_KEY` | `""` | Google Gemini API key. |
| `OPENAI_API_KEY` | `""` | OpenAI API key. |
| `EMAIL_MODE` | `development` | `development` (in-memory) or `smtp` (live delivery). |
| `SMTP_HOST` | `""` | Outgoing SMTP server host. |
| `SMTP_PORT` | `587` | Outgoing SMTP server port. |
| `SMTP_USER` | `""` | SMTP username / address. |
| `SMTP_PASSWORD` | `""` | SMTP password / app password. |
| `SMTP_FROM` | `noreply@career-agent.dev` | Sender address on reminder emails. |
| `EMBEDDING_PROVIDER` | `local` | Semantic embedding provider: `local` (CPU MiniLM) or `openai`. |
| `VITE_API_URL` | `/api` | Base API endpoint for frontend HTTP requests. |

---

## 5. Persistent Storage & Backups

Docker Compose provisions three named volumes:

1. **`career_agent_db_data`**: Houses `career_agent.db` containing users, auth hashes, practice records, and analytics.
2. **`career_agent_recordings`**: Houses recorded interview video and audio files organized by candidate ID.
3. **`career_agent_cache`**: Caches HuggingFace and SentenceTransformer model weights, preventing re-downloading on container restarts.

### SQLite Database Backup
Because SQLite allows non-blocking online backups while transactions are active, run:

```bash
docker exec career_agent_backend sqlite3 /app/data/career_agent.db ".backup '/app/data/backup_$(date +%Y%m%d_%H%M%S).db'"
```

Copy the backup to the host machine:
```bash
docker cp career_agent_backend:/app/data/backup_<timestamp>.db ./backups/
```

### Media Volume Backup
Archive all candidate interview recordings:
```bash
docker run --rm -v career_agent_recordings:/source -v $(pwd):/backup alpine tar czf /backup/recordings_backup.tar.gz -C /source .
```

---

## 6. Health Checks & Monitoring

The application includes two distinct health endpoints:

### Liveness Probe (`GET /api/health` or `GET /health`)
- Verifies that the ASGI web server is responsive and the background proactive reminder scheduler is running.
- Returns `HTTP 200` with JSON:
  ```json
  {
    "status": "healthy",
    "service": "AI Career Preparation Agent API",
    "version": "1.0.0",
    "schedulerActive": true
  }
  ```

### Readiness Probe (`GET /api/ready`)
- Verifies that the database engine can establish a connection and execute SQL queries.
- Returns `HTTP 200` when the database is connected.
- Returns `HTTP 503 Service Unavailable` if the database is disconnected or unreachable.

---

## 7. Operational Maintenance

### Viewing Real-Time Logs
```bash
# Follow backend logs
docker compose logs -f backend

# Follow frontend Nginx access/error logs
docker compose logs -f frontend
```

### Graceful Restart
```bash
docker compose restart
```

### Zero-Downtime Application Update
```bash
git pull origin main
docker compose build --no-cache
docker compose up -d
```

### Stopping Services
```bash
# Stop containers while preserving volume data
docker compose down

# Stop containers and remove volumes (WARNING: Deletes local database!)
docker compose down -v
```

---

## 8. Standalone Local Execution (Without Docker)

If Docker is not installed on your host machine, you can run the backend and frontend directly using Python and Node.

### Terminal 1: Backend (PowerShell)
```powershell
$env:PYTHONPATH=".;./backend"
$env:ENVIRONMENT="development"
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Terminal 2: Frontend (PowerShell)
```powershell
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser. Vite automatically proxies `/api` calls to `http://localhost:8000`.
