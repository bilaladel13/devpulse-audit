<div align="center">

# DevPulse

### Real-Time API Monitoring Dashboard & Health Alerting Engine

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests Passing](https://img.shields.io/badge/tests-50%20passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

<p align="center">
  A lightweight, real-time API monitoring platform equipped with automated periodic pinging, high-resolution latency tracking, health status classification (Healthy, Degraded, Down, Corrupted/Silent Failure), payload assertion validation, diagnostic snapshots with 1-click cURL repro, target pause/resume control, downtime incident timeline, and a responsive dark-mode Single Page Application (SPA) dashboard.
</p>

</div>

---

## Architecture Overview

```text
                               +------------------------------------------+
                               |        DevPulse Browser Dashboard        |
                               |    (Tailwind CSS + Glassmorphism SPA)    |
                               |  - Live Metrics & Health Status Cards    |
                               |  - Pause/Resume Actions & Settings Modal |
                               |  - Diagnostic Snapshot & cURL Inspector  |
                               |  - Incidents Timeline & Browser Alerts   |
                               +--------------------+---------------------+
                                                    |
                                    REST API Calls  |  Static Assets
                                    & Live Pings    |  (/, /app.js, /style.css)
                                                    v
+-----------------------------------------------------------------------------------+
| Express Backend Application (Port 3000)                                           |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  |   Static Router    |   |   Mock Controller   |   |  Monitoring Controller   |  |
|  |   (public/ SPA)    |   |   (/api/mock/*)     |   |  (/api/monitoring/*)     |  |
|  +--------------------+   +----------+----------+   +------------+-------------+  |
|                                      |                           |                |
|                                      |                           v                |
|                                      |              +--------------------------+  |
|                                      +------------> |    Monitoring Service    |  |
|                                                     | - Periodic Ping Loop     |  |
|                                                     | - Assertion Validator    |  |
|                                                     | - Diagnostic Snapshots   |  |
|                                                     | - Pause/Resume Engine    |  |
|                                                     | - Latency & Uptime Calc  |  |
|                                                     | - Incident State Machine |  |
|                                                     | - Export & Import System |  |
|                                                     +------------+-------------+  |
+------------------------------------------------------------------|----------------+
                                                                   |
                                          HTTP Ping / Health Probe |
                                                                   v
                                              +----------------------------+
                                              | External & Mock Endpoints  |
                                              | (Fast, Slow, Corrupted...) |
                                              +----------------------------+
```

---

## Core Features

- **Modern SPA Dashboard**: Sleek dark-mode interface with Tailwind CSS, real-time pulse indicator, auto-refresh countdown, and live metric cards.
- **Smart API Diagnostics & Silent Failure Detection**:
  - Validates response bodies against assertions: `not_contains` (silent failure detector), `contains`, `json_key_value` (with nested dotted paths), and `regex`.
  - Classifies endpoints returning HTTP 200 with corrupted payloads as `Silent Failure` (`corrupted`) and tracks dedicated incidents.
- **Diagnostic Snapshot & Root-Cause Inspector**:
  - Modal offering instant root-cause analysis and failure taxonomy (`ASSERTION_FAILED`, `HTTP_ERROR`, `TIMEOUT`, `NETWORK_ERROR`).
  - Network timing breakdown (DNS, TCP Connect, TTFB, Total).
  - Previews response body snippets and evaluated assertion rules.
  - 1-click **"Copy as cURL"** button for immediate command-line reproduction.
- **Target Pause/Resume Control**: Toggle background automated pings per target on the fly. Paused targets remain visible, display a `Paused` state, and dynamically update the active vs. paused counter without skewing health metrics.
- **Global Settings & Configuration**:
  - Configurable dashboard auto-refresh interval (5s, 10s, 30s, 60s, or manual).
  - Background automated ping loop frequency (5s, 10s, 15s, 30s, 60s).
  - Custom latency alert threshold (default 500ms) for `Degraded` classification.
  - Native Web Browser desktop notifications for service outages.
- **Incident & Downtime Timeline**: Real-time state machine tracking outages (`down`), latency degradations (`degraded`), silent failures (`corrupted`), and automatic recovery (`recovered`) with timestamps.
- **Data Portability (Export & Import)**: 1-click JSON export and import with deduplication protection against duplicate targets.
- **Smart Health Classification**:
  - `HEALTHY`: 100% reachable, response code matches expected status, latency &le; threshold, and all payload assertions passed.
  - `DEGRADED`: High latency (> threshold) or uptime drops below 90%.
  - `CORRUPTED`: Returns expected HTTP status (e.g. 200 OK) but response payload fails assertion validation (silent application failure).
  - `DOWN`: Failed ping, network timeout, or unexpected HTTP status code.
- **Production-Ready Docker**: Multi-stage Dockerfile with non-root security and single-command `docker compose` deployment.

---

## Directory Structure

```text
devpulse-audit/
├── public/                       # Frontend Single Page Application
│   ├── index.html                # SPA HTML5 dashboard (Tailwind CSS)
│   ├── app.js                    # Client application logic & API integration
│   └── style.css                 # Custom glassmorphism, animations & glows
├── src/                          # Backend TypeScript source code
│   ├── controllers/
│   │   ├── mock.controller.ts        # Mock endpoints with varying latency
│   │   └── monitoring.controller.ts  # Monitoring REST API controller
│   ├── routes/
│   │   ├── index.ts                  # Aggregated API router
│   │   ├── mock.routes.ts            # /api/mock routes
│   │   └── monitoring.routes.ts      # /api/monitoring routes
│   ├── services/
│   │   └── monitoring.service.ts     # In-memory monitoring & ping engine
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces and types
│   ├── app.ts                        # Express application & SPA static serving
│   ├── config.ts                     # Environment configuration
│   └── server.ts                     # Application entrypoint
├── tests/                        # Automated test suite (Vitest + Supertest)
│   ├── api.test.ts                   # REST API integration tests (24 tests)
│   └── monitoring.service.test.ts    # Service & calculation unit tests (14 tests)
├── Dockerfile                    # Multi-stage production container build
├── docker-compose.yml            # Single-command orchestration
├── .dockerignore                 # Docker build ignore rules
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── .gitignore
```

---

## Quickstart

### 1. Prerequisites
- Node.js &ge; 20.0.0
- npm &ge; 10.0.0

### 2. Local Installation & Development

```bash
# Clone the repository and install dependencies
npm install

# Run in development mode (with hot-reload via tsx)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Run

```bash
# Compile TypeScript to dist/
npm run build

# Start production server
npm start
```

### 4. Running Tests

```bash
# Run Vitest test suite (unit & integration tests)
npm test

# Run standalone verification scripts
npm run test:ping
npm run test:frontend
```

---

## Docker Deployment

### Run with Docker Compose (Recommended)

```bash
docker compose up -d --build
```

### Run with Docker CLI

```bash
# Build production image
docker build -t devpulse:latest .

# Run container
docker run -d -p 3000:3000 --name devpulse-container devpulse:latest
```

---

## API Reference

### Monitoring API (`/api/monitoring`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/monitoring/endpoints` | List all monitored endpoints |
| `POST` | `/api/monitoring/endpoints` | Register a new target to monitor |
| `GET` | `/api/monitoring/endpoints/:id` | Get details and calculated stats for an endpoint |
| `PUT` | `/api/monitoring/endpoints/:id` | Update an endpoint's configuration |
| `PATCH` | `/api/monitoring/endpoints/:id/toggle` | Toggle endpoint active/paused state |
| `DELETE` | `/api/monitoring/endpoints/:id` | Remove an endpoint from monitoring |
| `POST` | `/api/monitoring/endpoints/:id/ping` | Manually trigger a ping check for an endpoint |
| `GET` | `/api/monitoring/endpoints/:id/history` | Retrieve recent ping history logs |
| `GET` | `/api/monitoring/endpoints/:id/diagnostic` | Retrieve latest diagnostic snapshot, root cause, and cURL command |
| `POST` | `/api/monitoring/ping-all` | Manually ping all active endpoints |
| `GET` | `/api/monitoring/stats` | Retrieve overall health stats for all endpoints |
| `GET` | `/api/monitoring/settings` | Retrieve global monitoring settings |
| `PUT` | `/api/monitoring/settings` | Update global monitoring settings |
| `GET` | `/api/monitoring/incidents` | Retrieve incident & downtime timeline events |
| `GET` | `/api/monitoring/export` | Export configuration and endpoints as JSON |
| `POST` | `/api/monitoring/import` | Import configuration and endpoints from JSON |
| `POST` | `/api/monitoring/start` | Start the automated background ping loop |
| `POST` | `/api/monitoring/stop` | Stop the automated background ping loop |

### Mock Endpoints (`/api/mock`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/mock/fast` | Returns `200 OK` with 10–30ms latency |
| `GET` | `/api/mock/slow` | Returns `200 OK` with 400–800ms latency |
| `GET` | `/api/mock/flaky` | Intermittently returns `200 OK` (70%) or `500/503` (30%) with 50–300ms latency |
| `GET` | `/api/mock/error` | Returns `500 Internal Server Error` |
| `GET` | `/api/mock/corrupted` | Returns `200 OK` with simulated DB error payload (Silent Failure testing) |
| `GET` | `/api/mock/custom?delay=X&status=Y` | Configurable delay (ms) and HTTP status code |

---

## License

This project is licensed under the ISC License.
