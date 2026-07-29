# VaultMind Enterprise — Advanced Insider Threat & Deception Defense System

VaultMind is an enterprise-grade, real-time, event-driven insider threat detection, inductive graph forensics, and active deception response platform built for banking and high-security organizations.

---

## 🏛️ System Architecture & Zero-Downtime Infrastructure

The system is decoupled into four highly resilient layers:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             TELEMETRY & INGESTION                                │
│   Banking Core / SWIFT / RTGS / Core Banking System (JSON / Kafka Stream)       │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             STREAMING & DECOUPLING                               │
│                   Apache Kafka (Topic: vaultmind-transactions)                   │
└─────────────────────────────────────────┬────────────────────────────────────────┘
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            ASYNC WORKER ENGINE                                   │
│  FastAPI / Python Consumer Service + Redis Pub/Sub (`vaultmind:alerts`)          │
│  Row-Level Security (RLS) Tenant Isolation (`x-tenant-id`)                       │
└────────┬─────────────────────────────────────────────────────────────────┬───────┘
         │                                                                 │
         ▼                                                                 ▼
┌─────────────────────────────────┐       ┌────────────────────────────────────────┐
│     ADVANCED ML PIPELINE        │       │       ENTERPRISE CLIENTS               │
│ • Agent 1: Calibrated XGBoost   │       │ • Web Client: Modular React / Vite     │
│ • Agent 2: Inductive GraphSAGE  │       │ • Mobile App: Modular Expo / React Nat.│
│ • Active Learning Feedback Loop │       │ • Real-Time WebSocket Telemetry        │
└─────────────────────────────────┘       └────────────────────────────────────────┘
```

---

## 🛡️ Key Enterprise Features (Completed Phases 1–5)

### Phase 1: Security & Secrets Governance (Zero-Trust Foundation)
* **Centralized Secrets Governance (`server/core/secrets_config.py`)**: Strict environment validation preventing hardcoded credentials across server, client, and mobile layers.
* **Hardened Authentication (`server/core/auth.py`)**: Replaced insecure URL token query parameters with secure HttpOnly/SameSite cookies and hardened CORS headers.
* **Mobile Zero-Trust Storage (`mobile/src/utils/secure_storage.ts`)**: Replaced unencrypted `AsyncStorage` with `expo-secure-store` backed by OS hardware key stores (**iOS Keychain** and **Android Keystore**).

### Phase 2: Backend Architecture, Kafka Decoupling & Multi-Tenancy
* **Asynchronous Kafka Consumer Service (`services/kafka_consumer_service.py`)**: Non-blocking async execution handling high-throughput telemetry with Dead Letter Queue (DLQ) recovery.
* **Redis Pub/Sub State Decoupling (`server/core/master_orchestrator.py`)**: Replaced legacy in-memory state arrays with Redis Pub/Sub channels (`vaultmind:alerts`).
* **Multi-Tenant Row-Level Security (`server/core/models.py`)**: All database transactions and ORM models strictly enforce tenant isolation (`x-tenant-id`) with PostgreSQL/Supabase RLS policies.

### Phase 3: ML Pipeline Realism & Inductive Graph Inference
* **Calibrated XGBoost & Stratified CV (`scripts/train_agent1.py`)**: Dynamic positive-to-negative class weighting (`scale_pos_weight`) with 5-fold Stratified K-Fold validation producing audit artifacts (`cv_evaluation_report.json`).
* **Inductive GraphSAGE Node Embeddings (`server/core/ml_models.py` & `scripts/train_agent2.py`)**: On-the-fly inductive embedding generation for dynamic accounts created at runtime without legacy transductive lookup failures.
* **Analyst Active Learning Loop (`server/api/feedback_routes.py`)**: Dedicated `CONFIRM` / `FALSE_ALARM` feedback endpoints writing directly to an RLS-protected `model_retraining_queue` for continuous model self-improvement.

### Phase 4: Web Client Modularization (`client/`)
* **Single Source of Truth (`client/src/data.js`)**: Stripped duplicate frontend mock scoring logic (`scoreTransaction`) so the client consumes 100% backend ML intelligence.
* **WebSocket Isolation Hook (`client/src/hooks/useWebSocketAlerts.js`)**: Exponential backoff reconnect logic (`3s`, `6s`, `12s`, `30s`) with clean ZUSTAND state reconciliation.
* **Decomposed UI Views (`client/src/views/`)**: Refactored the 2,500+ line monolithic `App.jsx` into 7 modular, highly performant feature views (`DashboardView`, `RosterView`, `ProfileView`, `EvidenceView`, `DeceptionView`, `ReportsView`, `SettingsView`).

### Phase 5: Mobile App Modularization & Enterprise Hygiene (`mobile/`)
* **Decomposed Mobile Screen Architecture (`mobile/src/views/` & `styles/theme.ts`)**: Extracted 1,330+ lines of design tokens (`theme.ts`), reusable components (`CommonUI.tsx`), and 6 operational views (`CommandView`, `RosterView`, `ProfileView`, `DeceptionView`, `EvidenceView`, `ModalsView`) from the 3,980-line monolithic `index.tsx`.
* **Zero-Error TypeScript Enforcement**: All components compiled and verified cleanly via `npx tsc --noEmit`.

---

## 🚀 Quickstart & Verification Commands

### Backend Server (`server/`)
```bash
cd server
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Web Frontend (`client/`)
```bash
cd client
npm install
npm run build   # Verifies production asset bundling
npm run dev     # Starts local Vite development server
```

### Field Mobile Client (`mobile/`)
```bash
cd mobile
npm install
npx tsc --noEmit # Verifies zero-error strict TypeScript compliance
npm start        # Starts Expo dev tools (iOS/Android/Web)
```

---

## 📄 License & Compliance
Built under strict SOC 2 Type II and Banking Zero-Trust Data Governance architecture guidelines. All rights reserved.