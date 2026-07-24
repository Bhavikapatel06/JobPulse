# JobPulse 🚀

> AI-powered job tracking platform – Node.js + Express.js + MongoDB backend

---

## Architecture

```
JobPulse/
├── server.js                        ← Entry point
├── package.json
├── .env.example                     ← Copy → .env
├── logs/                            ← Auto-created by logger
└── src/
    ├── agents/
    │   ├── userPreferenceAgent.js   ← CRUD for user preferences
    │   ├── schedulerAgent.js        ← Cron: runs every minute
    │   ├── companyDataCheckerAgent.js ← Cache freshness check
    │   ├── searchAgent.js           ← Finds careers page URL (Gemini)
    │   ├── scrapingAgent.js         ← axios + cheerio / Puppeteer
    │   ├── jobFilteringAgent.js     ← Fuzzy role/location/exp filter
    │   └── reportGenerationAgent.js ← ANSI terminal report
    ├── models/
    │   ├── User.js                  ← Users collection
    │   └── CompanyJob.js            ← CompanyJobs collection
    ├── routes/
    │   ├── userRoutes.js
    │   └── jobRoutes.js
    ├── services/
    │   └── aiService.js             ← Gemini / OpenAI / Anthropic
    ├── config/
    │   ├── db.js                    ← MongoDB connection
    │   └── logger.js                ← Winston logger
    ├── utils/
    │   ├── timeUtils.js
    │   └── textUtils.js
    └── notifications/
        └── notificationService.js   ← Stub: Email / WhatsApp / Slack
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/jobpulse
AI_PROVIDER=gemini
GEMINI_API_KEY=<your-key-here>
GEMINI_MODEL=gemini-1.5-flash
DATA_FRESHNESS_HOURS=6
SCRAPE_DELAY_MS=2000
```

### 3. Start MongoDB (local Compass)

Make sure your local MongoDB instance is running on port `27017`.

### 4. Run the server

```bash
# Development (auto-restart on save)
npm run dev

# Production
npm start
```

---

## API Reference

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users` | Create a user with job preferences |
| `GET` | `/api/users` | List all users (`?active=true/false`) |
| `GET` | `/api/users/:id` | Get single user |
| `PUT` | `/api/users/:id` | Update preferences |
| `DELETE` | `/api/users/:id` | Soft-deactivate (`?hard=true` to delete) |
| `POST` | `/api/users/:id/trigger` | **Manually trigger report** (for testing) |

#### Example: Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "companies": ["Google", "Microsoft"],
    "desiredRole": "Backend Engineer",
    "filters": {
      "location": "Remote",
      "experienceLevel": "Senior"
    },
    "notifyTime": "09:30"
  }'
```

#### Example: Manual Trigger (test immediately)

```bash
curl -X POST http://localhost:3000/api/users/<USER_ID>/trigger
```

---

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/jobs` | List all cached company records |
| `GET` | `/api/jobs/:company` | View cached jobs for a company |
| `POST` | `/api/jobs/:company/refresh` | Force scrape refresh (bypass cache) |

---

## Workflow

```
Scheduler (every minute)
    │
    └─► Find users with notifyTime == HH:MM
            │
            └─► For each user, for each company:
                    │
                    ├─► CompanyDataChecker  →  DB fresh?
                    │         │  No          │  Yes
                    │         ▼              │
                    │   SearchAgent (Gemini) │
                    │         │              │
                    │         ▼              │
                    │   ScrapingAgent        │
                    │   (axios + Puppeteer)  │
                    │         │              │
                    │         ▼              │
                    │   Update DB ◄──────────┘
                    │
                    └─► JobFilteringAgent (fuzzy match)
                            │
                            └─► ReportGenerationAgent
                                      │
                                      └─► 🖥  Terminal Report
                                          📧  [future: Email]
                                          💬  [future: WhatsApp]
```

---

## Switching AI Provider

Edit `.env`:

```env
# Use OpenAI instead of Gemini
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

Then install the package:

```bash
npm install openai
```

No other code changes required – `aiService.js` handles routing automatically.

---

## Adding Notifications

Open [`src/notifications/notificationService.js`](./src/notifications/notificationService.js) and uncomment the desired channel in `dispatch()`. Implement the method body with your preferred SDK.

The `dispatch(user, reportData)` call is already wired into every report generation cycle.

---

## Data Freshness

Jobs are re-scraped if the `lastUpdated` timestamp in `CompanyJobs` is older than `DATA_FRESHNESS_HOURS` (default: **6 hours**). Force a refresh anytime via `POST /api/jobs/:company/refresh`.
