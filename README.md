<![CDATA[<p align="center">
  <h1 align="center">VaultMind Enterprise</h1>
  <p align="center">
    <strong>Real-Time Insider Threat Detection, Inductive Graph Forensics & Active Deception Defense Platform</strong>
  </p>
  <p align="center">
    Built for Banking & High-Security Financial Organizations
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Expo_SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white" alt="Kafka" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" alt="PyTorch" />
  <img src="https://img.shields.io/badge/XGBoost-337AB7?style=for-the-badge&logoColor=white" alt="XGBoost" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [8-Agent ML Ensemble Pipeline](#8-agent-ml-ensemble-pipeline)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
- [API Reference](#api-reference)
- [Web Client](#web-client-client)
- [Mobile App](#mobile-app-mobile)
- [Demo & Synthetic Data](#demo--synthetic-data)
- [Pre-Transaction Preventative Gateways](#pre-transaction-preventative-gateways)
- [Security Architecture](#security-architecture)
- [Testing & Verification](#testing--verification)
- [License & Compliance](#license--compliance)

---

## Overview

**VaultMind** is an enterprise-grade, event-driven platform that detects insider threats, money laundering patterns, and fraudulent banking transactions in real time. It combines an **8-agent ensemble ML pipeline** (XGBoost behavioral analysis + PyTorch GraphSAGE network inference + deterministic regulatory rule engines) with an **active deception defense layer** (honeypot traps) and a **human-in-the-loop active learning feedback system**.

### What Makes VaultMind Different

| Capability | Description |
|:---|:---|
| **8-Agent Parallel Ensemble** | Transactions are scored by 8 specialized agents in parallel, producing a weighted Composite Behavioural & Structural Integrity (CBSI) score |
| **Inductive Graph Neural Network** | PyTorch GraphSAGE generates embeddings for accounts *on the fly* — no retraining needed when new accounts appear |
| **Active Deception (Honeypots)** | Decoy bank accounts act as tripwires — any access triggers an instant kill-switch (CBSI = 100) and terminal isolation |
| **Court-Admissible Evidence** | Auto-generates tamper-proof PDF dossiers compliant with Section 63 of Bharatiya Sakshya Adhiniyam (BSA) 2023 and PMLA 2002, with SHA-256 hash chains and QR verification |
| **Human-in-the-Loop Learning** | Analyst `CONFIRM` / `FALSE_ALARM` feedback is queued for model retraining, enabling continuous self-improvement |
| **Multi-Tenant Row-Level Security** | Every database query is tenant-isolated via PostgreSQL RLS policies enforced through `x-tenant-id` headers |
| **Real-Time Streaming** | Apache Kafka ingestion → Redis Pub/Sub broadcasting → WebSocket delivery to all connected clients in < 2 seconds |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              TELEMETRY & INGESTION LAYER                            │
│         Banking Core / SWIFT / RTGS / Core Banking System (JSON / Kafka)            │
└───────────────────────────────────────┬──────────────────────────────────────────────┘
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              STREAMING & DECOUPLING LAYER                           │
│                    Apache Kafka  (Topic: live-transactions)                          │
│                    Dead Letter Queue: live-transactions-dlq                          │
└───────────────────────────────────────┬──────────────────────────────────────────────┘
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              ASYNC WORKER ENGINE                                    │
│     FastAPI / Uvicorn ASGI Server  +  Confluent Kafka Consumer Worker               │
│     Redis Pub/Sub (vaultmind:alerts)  +  Hot Cache (live_alerts, live_cbsi_scores)  │
│     Row-Level Security via x-tenant-id  +  SlowAPI Rate Limiting (60/min)           │
└──────────┬────────────────────────────────────────────────────────────────┬──────────┘
           │                                                                │
           ▼                                                                ▼
┌──────────────────────────────────┐     ┌─────────────────────────────────────────────┐
│     8-AGENT ML ENSEMBLE          │     │           ENTERPRISE CLIENTS                │
│                                  │     │                                             │
│  Agent 1: BehaviourWatch (XGB)   │     │  Web Client    — React 19 / Vite / Tailwind│
│  Agent 2: FundFlow (IP / Hops)   │     │  Mobile App    — Expo SDK 54 / React Native│
│  Agent 3: VendorGuard (RBAC)     │     │  Real-Time     — WebSocket + Redis Pub/Sub │
│  Agent 4: ComplaintSignal (NLP)  │     │  Realtime DB   — Supabase PostgreSQL       │
│  Agent 5: NetworkIntel (GNN)     │     │                                             │
│  Agent 6: RegulatoryAI (Rules)   │     ├─────────────────────────────────────────────┤
│  Agent 7: EvidenceBuilder (PDF)  │     │           EXTERNAL INTEGRATIONS             │
│  Agent 8: DeceptionGuard (Trap)  │     │  Google Gemini   — Glass-Box Explainability │
│                                  │     │  SMTP / Twilio   — Urgent Alerting          │
│  → Weighted CBSI Composite Score │     │  FIU-IND         — STR Filing               │
└──────────────────────────────────┘     └─────────────────────────────────────────────┘
```

### Data Flow

1. Banking transactions arrive via **Kafka** topic `live-transactions` (or in-memory CSV stream fallback)
2. The **Kafka Consumer Worker** deserializes and dispatches each transaction to the **MasterOrchestrator**
3. **Agent 8 (DeceptionGuard)** runs first — if a honeypot account is touched, CBSI is immediately set to 100 and the terminal is isolated (kill-switch)
4. Otherwise, **Agents 1–6** execute in parallel via `asyncio.gather`, each returning a sub-score
5. Sub-scores are combined into a **weighted CBSI composite** (Agent 1: 45%, Agent 6: 45%, others: 10% combined)
6. If CBSI ≥ 80, **Agent 7 (EvidenceBuilder)** auto-generates a court-admissible PDF dossier
7. The scored result is published to **Redis Pub/Sub** → broadcast to all **WebSocket** clients in real time
8. Analysts review alerts and submit `CONFIRM` / `FALSE_ALARM` feedback → queued for model retraining

---

## Technology Stack

### Backend (`server/`)
| Component | Technology | Purpose |
|:---|:---|:---|
| API Framework | FastAPI + Uvicorn | High-performance async REST & WebSocket server |
| ML — Behavioral | XGBoost + Scikit-Learn | 7-feature employee behavioral anomaly scoring |
| ML — Graph | PyTorch + GraphSAGE | Inductive graph neural network for topological money flow analysis |
| Generative AI | Google Gemini 2.0 Flash | Natural-language glass-box explainability for analysts |
| Message Streaming | Confluent Kafka | Real-time transaction ingestion with DLQ & exponential backoff retries |
| Cache & Pub/Sub | Redis | Hot alert cache, 7-day velocity tracking, cross-pod WebSocket relay |
| Database | Supabase (PostgreSQL) | Multi-tenant persistent storage with Row-Level Security |
| Auth & Security | JWT (HS256) + bcrypt | RBAC, HttpOnly cookies, brute-force lockout |
| Forensic Reports | ReportLab + qrcode + Pillow | Court-admissible PDF evidence packages with SHA-256 integrity chains |
| Rate Limiting | SlowAPI | IP-based request throttling (default 60/min) |

### Web Client (`client/`)
| Component | Technology | Purpose |
|:---|:---|:---|
| Framework | React 19 + Vite 8 | Fast SPA with HMR |
| Styling | Tailwind CSS 4 | Utility-first responsive design |
| State Management | Zustand v5 | Lightweight reactive global store |
| Charts | Recharts v3 | AreaChart, PieChart, RadialBarChart for dashboard analytics |
| Graph Visualization | react-force-graph-2d | Interactive force-directed fund flow graph |
| Animations | Framer Motion v12 | Smooth UI transitions and modal animations |
| Realtime | Supabase JS Client | PostgreSQL change notifications for evidence log updates |

### Mobile App (`mobile/`)
| Component | Technology | Purpose |
|:---|:---|:---|
| Framework | Expo SDK 54 + React Native 0.81 | Cross-platform native mobile app (iOS / Android) |
| Navigation | Expo Router 6 | File-based routing with bottom tab navigator |
| TypeScript | Strict mode | Full type safety across all components |
| SVG Rendering | react-native-svg v15 | India threat map, fund flow graphs, radar sweeps |
| Animations | react-native-reanimated v4 | Native-thread 60fps animations |
| Secure Storage | expo-secure-store | iOS Keychain / Android Keystore for JWT tokens |

### Infrastructure
| Component | Technology | Purpose |
|:---|:---|:---|
| Containerization | Docker + Docker Compose | 6-service orchestration (Kafka, Zookeeper, Redis, Backend, Web, Producer) |
| Reverse Proxy | Nginx Alpine | SPA serving, API/WebSocket proxying, path-based routing |
| Offline Builds | Pre-bundled Python wheels (`packages/`) | Air-gapped Docker builds without external PyPI access |

---

## 8-Agent ML Ensemble Pipeline

Each inbound transaction is processed through a coordinated ensemble of 8 specialized detection agents:

| Agent | Name | Method | Weight | Key Capability |
|:---:|:---|:---|:---:|:---|
| 1 | **BehaviourWatch** | XGBoost + Z-Score | 45% | 7-feature behavioral profiling: amount, dwell time, records accessed, login hour, velocity (amount vs. rolling avg, inter-txn latency, hourly count). Includes CIBIL score penalty and channel entropy detection. |
| 2 | **FundFlow** | IP Reputation + Graph Hops | 2% | Tor exit node detection, proxy CIDR matching, 3-hop graph cycle/smurfing detection |
| 3 | **VendorGuard** | RBAC Matrix | 5% | Role × action-type access control validation, historical transaction limit deviation |
| 4 | **ComplaintSignal** | NLP / TF-IDF | 1% | Distress lexicon matching ("benami", "pmla", coercion keywords), semantic cluster amplification |
| 5 | **NetworkIntel** | PyTorch GraphSAGE GNN | 2% | 2-layer SAGEConv edge classifier with inductive node enrollment for unseen accounts |
| 6 | **RegulatoryAI** | 14 Statutory Rules | 45% | RBI Master Directions, PMLA 2002, FEMA, Benami Prohibition Act compliance. Proportional logarithmic overshoot scoring (POS). |
| 7 | **EvidenceBuilder** | ReportLab PDF | — | Auto-generates court-admissible dossiers (BSA 2023 §63) with QR codes and SHA-256 tamper-proof chains. Triggered when CBSI ≥ 80. |
| 8 | **DeceptionGuard** | Honeypot Registry | — | **Kill-switch.** If decoy account (ACC_MIRAGE_001, ACC_DECOY_ALPHA, etc.) is accessed, CBSI → 100 and terminal is instantly isolated. Runs *before* all other agents. |

### CBSI Scoring Formula

```
CBSI = (Agent1_score × 0.45) + (Agent2_score × 0.02) + (Agent3_score × 0.05)
     + (Agent4_score × 0.01) + (Agent5_score × 0.02) + (Agent6_score × 0.45)
```

**Risk Tier Classification:**
| CBSI Range | Tier | Action |
|:---:|:---:|:---|
| ≥ 70 | 🔴 CRITICAL | Auto-generate evidence PDF, alert auditor, flag for STR |
| 50–69 | 🟠 HIGH | Escalate to senior analyst, enhanced monitoring |
| 30–49 | 🟡 WATCH | Flag for review, passive monitoring |
| < 30 | 🟢 NORMAL | Pass through, log only |

---

## Project Structure

```
IDEA_FINALE/
├── server/                          # FastAPI Backend & ML Engine
│   ├── main.py                      # Application entry point (Uvicorn ASGI)
│   ├── requirements.txt             # Full Python dependencies (includes PyTorch)
│   ├── requirements-docker.txt      # Lean Docker dependencies (CPU inference only)
│   ├── .env.example                 # Environment variable template
│   ├── api/
│   │   ├── api_server.py            # Core fraud monitoring, dashboard & gateway endpoints
│   │   ├── auth_routes.py           # JWT auth, login, signup, session management
│   │   └── feedback_routes.py       # Human-in-the-loop active learning routes
│   ├── core/
│   │   ├── master_orchestrator.py   # 8-agent ensemble coordinator & CBSI scoring
│   │   ├── ml_models.py             # Singleton model loader (XGBoost, GraphSAGE)
│   │   ├── auth.py                  # JWT generation, bcrypt hashing, RBAC guards
│   │   ├── db_connections.py        # Supabase (PostgreSQL) + Redis connection factory
│   │   ├── models.py                # SQLAlchemy ORM (FraudAlert, Tenant, EvidenceLog)
│   │   ├── historical_state.py      # 7-day moving averages, graph adjacency
│   │   ├── maker_checker.py         # IP collision detection for dual-approval fraud
│   │   ├── notifier.py              # SMTP email & Twilio SMS critical alerts
│   │   ├── pre_tx_gateway.py        # Preventative interlocks & WORM audit logging
│   │   └── secrets_config.py        # Centralized secrets validation & masking
│   ├── Agents/                      # Individual agent implementations
│   ├── models/                      # Serialized ML artifacts (.pkl, .pth, .json)
│   ├── services/
│   │   └── kafka_consumer_service.py # Decoupled Kafka worker with DLQ & retry logic
│   ├── evidence_output/             # WORM JSONL log, PDF dossiers, STR reports
│   └── data/Testing_data/           # Demo CSV datasets (warmup + live stream)
│
├── client/                          # React 19 Web Dashboard
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       ├── App.jsx                  # Master SPA router & layout
│       ├── store.js                 # Zustand global state
│       ├── apiService.js            # Authenticated HTTP client (cookie-based)
│       ├── hooks/
│       │   └── useWebSocketAlerts.js # WS connection with exponential backoff
│       ├── components/              # Reusable UI (KpiCard, WorldMap, FundFlowGraph, etc.)
│       └── views/                   # Feature views (Dashboard, Roster, Profile, Evidence, etc.)
│
├── mobile/                          # Expo SDK 54 Mobile App
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── _layout.tsx          # Expo Router root layout
│       │   └── index.tsx            # Main app (auth + bottom tab navigator)
│       ├── views/                   # Mobile views (Command, Roster, Graph, Decoy, Vault)
│       ├── components/              # CommonUI, ThreatMap, IndiaMapPaths
│       ├── styles/theme.ts          # Comprehensive DARK/LIGHT StyleSheet
│       └── utils/secure_storage.ts  # Hardware-backed secure JWT storage
│
├── scripts/                         # ML Training & DB Utilities
│   ├── train_agent1.py              # XGBoost training with SMOTE + Stratified 5-Fold CV
│   ├── train_agent2.py              # GraphSAGE GNN training with early stopping
│   └── inspect_db.py               # SQLite database inspector
│
├── packages/                        # 84 pre-compiled Python wheels for offline Docker builds
├── docker-compose.yml               # 6-service orchestration
├── Dockerfile.api                   # Backend container (Python 3.10, offline pip)
├── Dockerfile.web                   # Frontend container (Nginx Alpine)
├── nginx.conf                       # Reverse proxy (SPA + API + WebSocket routing)
├── generate_demo_data.py            # Synthetic data generator (8 fraud scenarios)
└── start_kafka_demo.py              # Live Kafka transaction publisher (2s intervals)
```

---

## Prerequisites

| Requirement | Version | Notes |
|:---|:---|:---|
| Python | 3.10+ | Backend server and ML training scripts |
| Node.js | 18+ | Web client and mobile app |
| npm | 9+ | Package management |
| Docker & Docker Compose | Latest | For containerized deployment |
| Supabase Account | — | PostgreSQL database with RLS |
| Redis | 6+ | Required for Pub/Sub and caching (auto-provisioned via Docker) |
| Apache Kafka | 7.5+ | Required for streaming (auto-provisioned via Docker, optional for local dev) |

---

## Environment Configuration

### Backend (`server/.env`)

Copy the template and fill in your credentials:

```bash
cp server/.env.example server/.env
```

| Variable | Required | Description | Example |
|:---|:---:|:---|:---|
| `VAULTMIND_ENV` | ✅ | Runtime mode | `development` or `production` |
| `SUPABASE_URL` | ✅ | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | ✅ | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `JWT_SECRET` | ✅ | HS256 signing secret | Random 64-char string |
| `JWT_ALGORITHM` | ✅ | JWT algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | ✅ | Token TTL in minutes | `60` |
| `ENCRYPTION_KEY` | ✅ | 64-char hex (32-byte AES) for SHA-256 ledger chaining | `a1b2c3d4...` |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for NLP explainability | `AIzaSy...` |
| `KAFKA_BROKER` | ⚠️ | Kafka bootstrap server | `localhost:9092` (local) / `kafka:29092` (Docker) |
| `EMBEDDED_KAFKA_CONSUMER` | ⚠️ | Run Kafka worker inside FastAPI | `true` or `false` |
| `REDIS_HOST` | ⚠️ | Redis server hostname | `localhost` or `redis` |
| `REDIS_PORT` | ⚠️ | Redis server port | `6379` |
| `ALLOWED_ORIGINS` | ⚠️ | CORS whitelist (comma-delimited) | `http://localhost:5173,http://localhost:8080` |
| `MODEL_PATH` | — | Path to ML model artifacts | `./models/` |
| `CLERK_LIMIT` | — | Max transaction limit for Clerk role (INR) | `5000000` |
| `MANAGER_LIMIT` | — | Max transaction limit for Manager role (INR) | `50000000` |
| `ADMIN_LIMIT` | — | Max transaction limit for Admin role (INR) | `500000000` |
| `IT_ADMIN_LIMIT` | — | Max transaction limit for IT Admin role (INR) | `0` |
| `SMTP_SERVER` | — | SMTP server for email alerts | `smtp.gmail.com` |
| `SMTP_PORT` | — | SMTP port | `587` |
| `SMTP_USER` | — | SMTP username | `alerts@company.com` |
| `SMTP_PASSWORD` | — | SMTP password | `app-password` |
| `AUDITOR_EMAIL` | — | Alert recipient email | `auditor@company.com` |
| `TWILIO_ACCOUNT_SID` | — | Twilio SID for SMS alerts | `ACxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | — | Twilio auth token | `xxxxxxxxx` |
| `TWILIO_FROM_NUMBER` | — | Twilio sender number | `+1234567890` |
| `AUDITOR_PHONE` | — | SMS alert recipient | `+91xxxxxxxxxx` |

> ✅ = Required &nbsp; ⚠️ = Required for streaming/caching features &nbsp; — = Optional

### Web Client (`client/.env`)

```bash
cp client/.env.example client/.env
```

| Variable | Description |
|:---|:---|
| `VITE_SUPABASE_URL` | Supabase project URL (public) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_API_DOMAIN` | Production API domain (optional, defaults to `api.vaultmind.systems`) |

### Mobile App

The mobile app configures its backend host at runtime via an in-app "Configure Backend IP" screen. JWT tokens are stored in hardware-backed secure storage (iOS Keychain / Android Keystore).

---

## Getting Started

### Local Development

#### 1. Backend Server

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Copy and configure your environment:
```bash
cp .env.example .env
# Edit .env with your Supabase, Gemini, and JWT credentials
```

Start the server:
```bash
python main.py
# Server starts at http://localhost:8000
```

> **Note:** Without Kafka running, the server automatically falls back to in-memory CSV streaming. Use the `/api/system/start-stream` endpoint to trigger the built-in demo stream.

#### 2. Web Client

```bash
cd client
npm install
cp .env.example .env
# Edit .env with your Supabase public credentials
```

```bash
npm run dev          # Development server at http://localhost:5173
npm run build        # Production build → client/dist/
```

> The Vite dev server auto-proxies `/api/` and `/ws/` requests to `http://localhost:8000`.

#### 3. Mobile App

```bash
cd mobile
npm install
```

```bash
npx tsc --noEmit     # Verify TypeScript compilation (zero errors)
npm start            # Launch Expo dev tools (iOS / Android / Web)
```

> On first launch, configure the backend IP address via the in-app settings to point to your server.

---

### Docker Deployment

The full stack can be deployed with a single command using Docker Compose, which orchestrates 6 services:

| Service | Container | Port | Description |
|:---|:---|:---:|:---|
| `zookeeper` | Confluent ZooKeeper | 2181 | Kafka cluster coordination |
| `kafka` | Confluent Kafka | 9092 | Message broker for live transactions |
| `kafka-init` | One-shot | — | Creates `live-transactions` topic on startup |
| `redis` | Redis Alpine | 6379 | Pub/Sub, hot cache, velocity tracking |
| `backend` | VaultMind API | 8000 | FastAPI server with embedded Kafka consumer |
| `web` | Nginx | 8080 | Serves React SPA + reverse proxies API/WS |
| `producer` | Demo Publisher | — | Publishes transactions to Kafka every 2 seconds |

#### Steps

```bash
# 1. Build the frontend production bundle
cd client && npm install && npm run build && cd ..

# 2. Launch the full stack
docker-compose up --build -d

# 3. Verify all services are running
docker-compose ps
```

> **Offline Build:** The backend Docker image installs dependencies from pre-bundled wheels in `packages/`, requiring no external PyPI access — suitable for air-gapped environments.

**Access Points:**
- Web Dashboard: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- API Health Check: `http://localhost:8000/`

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/api/auth/signup` | — | Register a new bank employee/analyst account |
| `POST` | `/api/auth/login` | — | Authenticate and receive JWT (set as HttpOnly cookie `vm_token`). IP rate-limited to 5 attempts. |
| `POST` | `/api/auth/logout` | — | Clear session cookie |
| `GET` | `/api/auth/me` | 🔒 | Return current authenticated user profile |

### Dashboard & Analytics (`/api`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `GET` | `/api/dashboard/kpis` | 🔒 | Aggregate KPIs: total scanned, critical alerts, confirmed frauds, avg CBSI |
| `GET` | `/api/dashboard-init` | 🔒 | Batch of recently scored transactions for initial dashboard hydration |
| `GET` | `/api/alerts/latest` | 🔒 | Top 50 alerts from Redis hot cache (sub-millisecond) |
| `GET` | `/api/stream/kafka-sim` | 🔒 | Recent alerts buffer from historical state |
| `GET` | `/api/roster/employees` | 🔒 | Full employee directory with metadata |

### Intelligence & Forensics (`/api`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/api/explain/{emp_id}` | 🔒 Auditor/Analyst | Glass-box AI explanation via Gemini (3-sentence natural language summary) |
| `GET` | `/api/graph/fundflow` | 🔒 | Dynamic fund-flow graph (nodes + edges) for force-directed visualization |
| `GET` | `/api/profile/{emp_id}/history` | 🔒 Auditor+ | 7-day rolling transaction volume from Redis sorted sets |
| `GET` | `/api/deception/honeypots` | 🔒 | Honeypot decoy account registry with breach status |
| `GET` | `/api/evidence/download` | 🔒 Auditor+ | Download court-admissible PDF evidence dossier (path-traversal protected) |
| `POST` | `/api/evidence/file-str` | 🔒 Auditor | File Suspicious Transaction Report (STR) to FIU-IND |

### Analyst Feedback & Active Learning (`/api`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/api/feedback/{emp_id}` | 🔒 Auditor+ | Submit `CONFIRM` (locks terminal, files STR) or `FALSE_ALARM` (recalibrates baseline) |
| `POST` | `/api/alerts/{alert_id}/feedback` | 🔒 Auditor+ | Push feedback to `model_retraining_queue` and broadcast via Redis |
| `GET` | `/api/alerts/retraining-queue` | 🔒 Auditor+ | View unprocessed feedback records awaiting batch retraining |

### Operations & Control (`/api`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/api/system/start-stream` | 🔒 | Start the built-in CSV demo stream (no Kafka required) |
| `POST` | `/api/orchestrator/scan` | 🔒 Auditor+ | Manually trigger full 8-agent pipeline for a single transaction |
| `GET` | `/get-next-transaction` | 🔒 | Fallback polling endpoint for next processed transaction |

### WebSocket

| Protocol | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `WS` | `/ws/alerts` | 🔒 Cookie/Header | Real-time scored transaction stream. Authenticates via `vm_token` HttpOnly cookie or `Authorization` header. Query-param tokens are **rejected** (closes with WS 1008). |

> 🔒 = Requires JWT authentication &nbsp;&nbsp; 🔒 Auditor+ = Requires specific RBAC role

---

## Web Client (`client/`)

The web dashboard is a modular React 19 SPA with 7 feature views:

| View | Description |
|:---|:---|
| **DashboardView** (Command Centre) | Live KPI counters, interactive India threat map, critical alert feed, CBSI trend chart, risk tier pie chart, transaction channel breakdown |
| **RosterView** | Searchable employee directory with role/risk-tier filters and pagination |
| **ProfileView** | Deep forensic dossier: ForensicTimeline (CCTV playback), GlassBoxEngine (AI explanation), BlastRadius (shared-IP contagion), SHAP Simulator (what-if sliders), GNN Threat Node |
| **FundFlowGraph** | Interactive force-directed canvas showing transaction relationships. Click a node → IncidentPanel with one-click: Freeze Credentials, Forensic Hold, Evidence Generation |
| **DeceptionView** | Honeypot radar visualization with rotating sweep animation and decoy breach status |
| **EvidenceView** | Evidence vault with Supabase realtime log updates, PDF/STR generation triggers |
| **ReportsView** | Dossier compiler (PDF/CSV/JSON export) and GNN model retrain pipeline interface |
| **SettingsView** | Orchestrator stream thresholds, queue limits, and webhook configuration |

**State Management:** Zustand v5 store managing theme (dark/light), active page, search queries, scored transactions buffer, employee metadata cache, evidence logs, and incident tracking.

**Auth Flow:** Backend-managed HttpOnly cookies (`vm_token`) — no tokens stored in browser JavaScript. Auto-logout on 401 responses.

---

## Mobile App (`mobile/`)

The mobile app is built with Expo SDK 54 and provides field-ready access to VaultMind:

| Tab | Screen | Description |
|:---|:---|:---|
| Command | `CommandView` | KPI horizontal scroller, interactive SVG India threat map, critical alerts, live activity |
| Roster | `RosterView` | Employee list with filter pills (role + risk tier) |
| Graph | `ProfileView` | Animated SVG fund flow graph with selectable employee nodes and flow line animations |
| Decoy | `DeceptionView` | Animated radar sweep with honeypot targets |
| Vault | `EvidenceView` | STR dossier generator and evidence log archive |

**Modals:**
- `ProfileDetailModal` — Slide-up with 4 tabs: Timeline, GlassBox, SHAP, Blast Radius
- `FraudAlertModal` — Auto-popup when incoming CBSI ≥ 70

**Security:** JWT tokens stored in hardware-backed secure storage (`expo-secure-store`) with automatic `AsyncStorage` fallback on web preview.

**Connectivity:** Configurable backend IP (persisted in `AsyncStorage`). WebSocket with 4s auto-reconnect + fallback HTTP polling every 3s.

---

## Demo & Synthetic Data

### Generate Demo Dataset

```bash
python generate_demo_data.py
```

Generates:
- `server/data/Testing_data/historical_warmup_data.csv` — 200 warmup transactions
- `server/data/Testing_data/live_demo_stream.csv` — 400 streaming transactions
- `server/data/Testing_data/employees_master.csv` — 500 synthetic employees
- `server/data/Testing_data/metadata.json` — Run configuration

**Interleave Pattern:** 10 normal transactions → 1 critical fraud → repeat

**8 Rotating Fraud Scenarios:**

| # | Scenario | Description |
|:---:|:---|:---|
| 0 | Maker-Checker Collusion | High-value RTGS initiated by a Clerk after hours (20:00–23:00) |
| 1 | Midnight Harvest | Bulk export of 20K–50K customer records by IT Admin at 02:00–04:00 |
| 2 | Toxic NLP | Loan approval linked with bribery extortion in complaints |
| 3 | Smurfing | Rapid ATM withdrawals just below statutory audit thresholds |
| 4 | Ghost Vendor | RTGS wire to unapproved shell accounts (`SHELL_xxx`) |
| 5 | Channel Hopping | Rapid switching across UPI → IMPS → NEFT → RTGS |
| 6 | Privilege Escalation | Clerk executing unauthorized Manager-level `Approve` actions |
| 7 | Honeypot Trip | Accessing deceptive decoy accounts (`ACC_MIRAGE_001`, `ACC_DECOY_ALPHA`) |

### Kafka Live Publisher

```bash
python start_kafka_demo.py
```

Publishes 1 transaction every 2 seconds to Kafka topic `live-transactions` in an infinite loop, with real-time timestamps.

### In-Memory Fallback (No Kafka Required)

After logging in to the web dashboard, trigger the built-in demo stream via the UI or:
```bash
curl -X POST http://localhost:8000/api/system/start-stream \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## Pre-Transaction Preventative Gateways

VaultMind includes 5 pre-CBS (Core Banking System) validation interlocks that block suspicious operations *before* they execute:

| Gateway | Endpoint | What It Prevents |
|:---|:---|:---|
| **Mobile Update Guard** | `POST /api/gateway/verify-mobile-update` | Blocks dormant account mobile number changes without biometric AEPS verification |
| **GSTIN Payout Validator** | `POST /api/gateway/verify-gstin-payout` | Validates vendor GSTN registry status before RTGS/NEFT loan disbursements |
| **CIF Dedup Guard** | `POST /api/gateway/verify-cif-onboarding` | Levenshtein fuzzy matching + PAN/Aadhaar hashes to prevent duplicate CIF creation (anti-evergreening) |
| **IoT Vault Verifier** | `POST /api/gateway/verify-iot-cash-deposit` | Validates CBS cash deposits against cryptographically signed IoT note-counting hardware tokens |
| **FIU Webhook Receiver** | `POST /api/webhooks/fiu-alert` | Ingests FIU-IND / Account Aggregator cross-bank kickback alerts for FCU investigation |

All gateway events are cryptographically hashed and appended to the **WORM (Write-Once-Read-Many) security ledger** at `server/evidence_output/worm_security_log.jsonl`.

---

## Security Architecture

| Layer | Implementation |
|:---|:---|
| **Authentication** | JWT (HS256) with configurable expiration. Delivered via secure HttpOnly/SameSite cookies (`vm_token`) — never exposed to client-side JavaScript. |
| **Password Storage** | Salted bcrypt hashing (`bcrypt.hashpw` / `bcrypt.checkpw`). Migration script available for legacy plaintext passwords. |
| **Brute Force Protection** | In-memory IP-based counter locks accounts after 5 consecutive failed login attempts. |
| **RBAC** | `require_role()` dependency guard. Roles: `auditor`, `analyst`, `admin`, `manager`. |
| **WebSocket Security** | Zero query-parameter token leakage. Auth via cookie or header only. Invalid tokens close with WS 1008 (Policy Violation). |
| **Multi-Tenancy** | PostgreSQL Row-Level Security (RLS) enforced via `x-tenant-id` header injection on every Supabase query. |
| **Secrets Management** | Centralized `SecretsManager` singleton. Production mode blocks startup if secrets are missing or contain placeholder values. Diagnostic `mask()` utility protects credentials in logs. |
| **CORS** | Explicit origin whitelist via `ALLOWED_ORIGINS` env variable. `allow_credentials=True` with restricted HTTP methods. |
| **Maker-Checker Fraud Prevention** | Redis-cached maker IP with 24hr TTL. Checker approval from same IP → instant `HTTP 403` + auto-generated critical alert. |
| **Path Traversal Protection** | Evidence downloads use `os.path.realpath()` validation against the `evidence_output/pdf_reports` directory. |
| **Tamper-Evident Ledger** | Blockchain-style SHA-256 hash chaining across all fraud alerts (`previous_hash` → `block_hash_sha256`). |
| **WORM Audit Log** | Append-only JSONL ledger with per-entry `integrity_hash` for forensic immutability. |
| **Mobile Secure Storage** | JWT tokens stored in iOS Keychain / Android Keystore via `expo-secure-store`. Automatic fallback to `AsyncStorage` on web. |
| **Rate Limiting** | SlowAPI with `60/minute` default and per-route overrides (e.g., 5 attempts on login). |

---

## Testing & Verification

### Backend

```bash
cd server
python main.py                  # Verify server starts without errors
# Health check: GET http://localhost:8000/
```

### Web Client

```bash
cd client
npm run build                   # Verify production bundle compiles
npm run dev                     # Start development server with HMR
```

### Mobile App

```bash
cd mobile
npx tsc --noEmit                # Verify zero-error strict TypeScript
npm start                       # Launch Expo dev tools
```

### ML Model Training

```bash
# Agent 1: XGBoost with Stratified 5-Fold CV
python scripts/train_agent1.py
# Outputs: server/models/agent1_iso_forest.pkl, agent1_scaler.pkl, cv_evaluation_report.json

# Agent 2: GraphSAGE GNN with Early Stopping
python scripts/train_agent2.py
# Outputs: server/models/agent2_gnn.pth, account_mapping.pkl
```

### Database Inspection

```bash
python scripts/inspect_db.py    # List tables and dump first 5 records from SQLite
```

---

## License & Compliance

Built under strict **SOC 2 Type II** and **Banking Zero-Trust Data Governance** architecture guidelines.

**Regulatory Frameworks Implemented:**
- Reserve Bank of India (RBI) Master Directions
- Prevention of Money Laundering Act (PMLA) 2002
- Foreign Exchange Management Act (FEMA)
- Benami Transactions (Prohibition) Amendment Act
- Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 63 — Digital Evidence Admissibility

All rights reserved.
]]>