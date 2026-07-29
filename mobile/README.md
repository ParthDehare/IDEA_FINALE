# VaultMind Mobile Operations Client (React Native / Expo)

VaultMind Mobile is the enterprise field-operations and command application for real-time insider threat detection, forensic investigation, and active deception monitoring. Built with **React Native (Expo 54)** and **TypeScript**, it interfaces directly with the VaultMind asynchronous backend orchestration engine over secure REST and WebSocket telemetry channels.

---

## Architecture & Modular Design

To ensure zero downtime, strict maintainability, and clean separation of concerns across SOC analyst workflows, the mobile architecture is modularized into dedicated feature layers:

```
mobile/src/
├── app/
│   ├── _layout.tsx           # Expo Router Root Stack & Splash Screen Controller
│   └── index.tsx             # Main App Shell, Auth State Guard, Data Fetching Orchestrator
├── views/                    # Modularized Field Operations Views
│   ├── CommandView.tsx       # Command Centre Dashboard (KPIs, Live Activity Stream, Threat Map)
│   ├── RosterView.tsx        # Employee Roster & Risk Tier Filtering Registry
│   ├── ProfileView.tsx       # Forensic Profile Search & GraphSAGE Network Inference Visualization
│   ├── DeceptionView.tsx     # DeceptionGuard Honeypot Radar & Mirage Account Monitor
│   ├── EvidenceView.tsx      # Evidence Vault & SHA-256 PDF Dossier Generator
│   └── ModalsView.tsx        # Slide-up Profile Detail & Cyberpunk Fraud Alert Overlays
├── components/               # Reusable UI Components & Visualizations
│   ├── CommonUI.tsx          # Sparklines, KPI Cards, Risk Tier Colors, Safe JSON Parser
│   ├── ThreatMap.tsx         # Geographic India Map Visualization of Active Nodes & Incidents
│   └── IndiaMapPaths.js      # High-Precision SVG Paths for Geographic Threat Mapping
├── styles/
│   └── theme.ts              # Centralized Design Tokens (DARK / LIGHT Themes & StyleSheet Builder)
└── utils/
    └── secure_storage.ts     # Expo Secure Store Wrapper (iOS Keychain / Android Keystore)
```

---

## Core Operational Capabilities

### 1. Zero-Trust Security & Storage Wrapper (`secure_storage.ts`)
* All sensitive session tokens, JWTs, and operational metadata are encrypted at rest using `expo-secure-store` backed by hardware-level OS key stores (**iOS Keychain** and **Android Keystore**).
* Avoids legacy unencrypted `AsyncStorage` leaks, enforcing strict zero-trust hygiene across mobile sessions.

### 2. Command Centre & Real-Time Alerting (`CommandView.tsx`)
* **KPI Metrics Engine**: Real-time evaluation of total scanned transactions, critical alerts (`CBSI ≥ 70`), high-risk flags (`CBSI 50-69`), confirmed fraud cases, and network average scores.
* **Sparkline Visualizations**: Custom SVG trend indicators showing real-time arrival momentum across active metrics.
* **Geographic Threat Map**: Interactive India map rendering employee activity origins and active incident hotspots.

### 3. Forensic Profile Search & Network Inference (`ProfileView.tsx`)
* **Interactive Fund Flow Graph**: Visualizes multi-hop financial transactions (`GraphSAGE` node relationships) centered on selected focus employees.
* **Dynamic Node Styling**: Highlights high-risk core nodes (`CBSI ≥ 70` red pulsation), honeypot targets (`amber` glow), and destination account transaction volumes (`Rs. Lakhs`).

### 4. DeceptionGuard Honeypot Radar (`DeceptionView.tsx`)
* **Live Radar Sweeper**: Animated rotating sweeper monitoring active decoy/mirage bank accounts (`EMP_1024_HONEYPOT`, etc.).
* **Instant Breach Detection**: Immediately highlights breached decoy accounts with visual alerts when unauthorized access attempts occur.

### 5. Evidence Vault & FIU Dossier Generation (`EvidenceView.tsx`)
* **Forensic Dossier Export**: Triggers backend generation of formal, court-admissible PDF dossiers with SHA-256 integrity hashes.
* **Immutable Audit Trail**: Tracks hash block signatures and download status directly on mobile devices for SOC compliance.

---

## Getting Started & Deployment

### Prerequisites
* **Node.js** v18+ and **npm** v9+
* **Expo CLI** (`npm install -g expo-cli`)
* **Android Studio** (for Android Emulator) or **Xcode** (for iOS Simulator)

### Installation & Run Commands

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript strict compiler verification (Zero errors guaranteed)
npx tsc --noEmit

# 3. Start Expo development server
npm start

# Run specifically for Android Emulator
npm run android

# Run specifically for iOS Simulator
npm run ios
```

---

## Backend Connectivity Configuration

By default, the mobile app connects to your local or staging backend API host. You can dynamically configure the target backend inside the login prompt or by setting `apiHost`:

* **Android Emulator Default**: `http://10.0.2.2:8000` (Maps to host machine localhost)
* **iOS Simulator / Local Network**: `http://192.168.1.X:8000` (Or your local network IP)
* **Production / Staging**: Configure HTTPS endpoints directly in the settings panel.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
