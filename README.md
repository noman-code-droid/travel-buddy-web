# 🧭 Travel Buddy

**A safe, AI-augmented ride-sharing and trip-planning platform built for the Pakistani travel market.**

Travel Buddy solves a real, everyday problem for commuters and travelers in Pakistan: finding safe, affordable shared rides, and getting trustworthy, locally-aware travel advice — road safety conditions, hotel/POI recommendations, and seasonal advisories — that no generic global travel app localizes for Pakistan's roads and terrain.

**Built for:** daily commuters and car owners looking to share rides, and travelers planning trips across Pakistan (including remote northern routes) who need real, locally-grounded guidance rather than generic AI suggestions.

---

## 🔗 Live App

**[https://travel-buddy-web-omega.vercel.app](https://travel-buddy-web-omega.vercel.app)**

---

## ✨ Features

### Ride Sharing
- Passenger ride search and driver ride matching
- Real-time ride tracking via Firestore live subscriptions
- Live in-app chat between passenger and driver
- Ride completion flow with trip summary and two-way rating system
- Driver earnings and passenger savings tracking (`finance.ts`)

### Safety
- Dedicated Safety tab for managing trusted emergency contacts
- User-triggered live location sharing during an active ride (via device share/WhatsApp link — not an automated backend alert)
- Rigorous driver onboarding: CNIC/License photo upload, reviewed and approved through an admin portal

### 💰 The "Buddy" Economy
- **Zero-profit fuel-sharing model** — unlike commercial ride-hailing, Travel Buddy is a true carpooling platform, not a for-profit dispatch service
- **Standardized per-km rates**, calculated from Pakistani average fuel costs:
  - 🚗 Small cars: 38 PKR/km
  - 🚙 Large cars/SUVs: 54 PKR/km
- **Cost splitting** — the fare is divided equally among all occupants, including the driver, rather than the driver profiting off passengers

### AI Travel Assistant (Explore tab)
- Conversational AI assistant grounded in a custom-built Pakistani travel knowledge base
- Recommends hotels, points of interest, and restaurants by city
- Surfaces road safety advisories (seasonal closures, landslide-prone routes, checkpoint delays) relevant to Pakistan specifically — not covered by international trip planners
- Aware of seasonal travel windows and local festivals (e.g. Shandur Polo Festival, Kalash festivals) for "best time to visit" guidance

### Admin Portal
- Dedicated admin route (`/nomanthesuperadmin`) for driver verification and platform management

### PWA Experience
- Installable Progressive Web App with a mobile-first, app-like interface
- Hardware-accelerated screen transitions (Framer Motion) for a native-feeling UX on a 360px mobile viewport

---

## 🤖 The AI Feature — RAG-Powered Travel Assistant

The AI Assistant is a **Retrieval-Augmented Generation (RAG)** system, not a plain chatbot wrapper. Instead of letting the model freely generate travel advice from its training data (which risks confident-sounding but wrong hotel names, phone numbers, or road conditions), it answers using **real, curated data retrieved from our own knowledge base** at query time.

### Why RAG instead of just calling Gemini directly

Generic AI chat can hallucinate specifics — a phone number that looks plausible but doesn't exist, a hotel name that isn't real, road advice that's outdated or wrong for Pakistan specifically. For a travel app, that's a trust problem, not just an accuracy nitpick. RAG fixes this by forcing the model to ground every factual claim in verified rows from our database, and to say "I don't have that information" rather than guess.

### The knowledge base

Five curated Pakistani travel datasets live in Postgres, seeded via `scripts/seed.ts`:

| Dataset | Rows | Powers |
|---|---|---|
| Hotels | ~1,000 (deduplicated) | Accommodation recommendations by city/budget/rating |
| Points of Interest | 138 | Attractions, viewpoints, historical sites, nature spots |
| Restaurants | 120 | Food recommendations by city and cuisine |
| Road Safety Advisories | 23 | Seasonal closures, landslide-prone routes, checkpoint delays |
| Seasonal Events | 20 | Festivals and "best time to visit" windows |

This is the app's real differentiator: no mainstream global trip planner localizes road safety or seasonal advisories for Pakistan's terrain (e.g. Babusar Top's winter closure, monsoon landslide risk on the Karakoram Highway). This data does.

### How a query actually flows through the system

1. **User asks a question** — e.g. *"Plan a 3-day trip to Hunza next month, budget 30k, I like nature and photography."*
2. **Retrieval** (`lib/knowledge.ts`) — the query is matched against the Postgres knowledge base using text search (`tsvector`/`tsquery`) across the five datasets above, filtered by city/region where relevant. Only the top-matching rows per category (hotels, POIs, restaurants, advisories, events) are pulled — not the whole table — to keep the AI's context focused and relevant.
3. **System grounding** — the retrieved rows are combined with a hardcoded "Official Knowledge Base" also defined in `lib/knowledge.ts`, which holds core business rules that don't change per query: fare pricing (38/54 PKR per km), SOS/emergency numbers, and standing motorway safety guidance. This ensures pricing and safety facts stay consistent even when the database retrieval step returns nothing relevant.
4. **Grounding into the prompt** — the combined retrieved rows + official knowledge base are formatted and injected into the prompt sent to Gemini, alongside the user's original question.
5. **Generation** — Gemini writes the natural-language response (e.g. a day-by-day itinerary), but is explicitly instructed to only state facts present in the retrieved data — contact numbers and place names come directly from the database, not from the model's own memory.
6. **Response** — the user sees a coherent, conversational answer that's actually anchored to real, verifiable Pakistani travel data.

### Core system instruction given to the model

> *"You are a Pakistani travel assistant. Using only the verified data provided below, answer the user's question. Never invent hotel names, phone numbers, or road conditions that are not present in the supplied data. If the data doesn't cover something, say so rather than guessing."*

This single instruction is what turns Gemini from a generic chatbot into a grounded, trustworthy assistant — it's the difference between "sounds right" and "is right."

### Model used

**Google Gemini** (Flash / Flash-Lite tier) via the Gemini API — chosen for its large context window (1M tokens), which comfortably fits the retrieved knowledge-base context alongside conversation history, and its free-tier availability during development.

---

## 🧱 Technical Architecture

Travel Buddy follows an **MVVM (Model-View-ViewModel)** pattern adapted for React/Next.js.

| Layer | Implementation |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| View | `/app` and `/components` — feature views (`FindRideView`, `ChatView`, `PlannerView`) + reusable `/ui` primitives |
| ViewModel | `/hooks/useAppViewModel.ts` — centralizes auth state, Firestore subscriptions, navigation, and route calculations |
| Services | `/lib` — `firebase.ts` (Auth/Firestore), `finance.ts` (earnings logic), `knowledge.ts` (AI knowledge base interface) |
| Data model | `/types/index.ts` — shared TypeScript interfaces for `Ride`, `User`, `Chat`, `Notification` |
| Data engineering | `/scripts/seed.ts` + `/data/raw` — parses hotel/POI/safety CSV/XLSX datasets into Postgres with `tsvector` search indexing |
| Styling | Tailwind CSS, mobile-first (360px baseline) |

**Database (hybrid, split by data type):**
- **Firebase / Firestore** — real-time transactional data: chat, live ride tracking, notifications
- **Vercel Postgres** — the AI knowledge base (hotels, POIs, restaurants, safety advisories, seasonal events), used for RAG retrieval

This split keeps fast-changing real-time data (Firestore) separate from the curated, query-heavy knowledge base (Postgres) — each database is used for what it's actually good at.

---

## 🛠 Tools, Services & AI Models Used

- **Framework:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Animation:** Framer Motion
- **Auth & Real-time data:** Firebase / Firestore
- **Knowledge base / vector-search-ready storage:** Vercel Postgres
- **AI model:** Google Gemini API (Flash / Flash-Lite)
- **Hosting/Deployment:** Vercel
- **Data validation (in progress):** Zod, for sanitizing seeded CSV/XLSX data before it reaches the AI knowledge base

---

## 📸 Screenshots

> _Add at least 3 screenshots of the live app here before submitting — e.g. the ride-finding flow, the AI Explore/chat tab, and the Safety tab._

| | | |
|---|---|---|
| ![Home](./screenshots/home.png) | ![AI Assistant](./screenshots/ai-assistant.png) | ![Ride Tracking](./screenshots/ride-tracking.png) |

---

## ▶️ How to Run the Project Locally

```bash
# 1. Clone the repository
git clone https://github.com/noman-code-droid/travel-buddy-web.git
cd travel-buddy-web

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env.local file in the root with:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# POSTGRES_URL=your_vercel_postgres_connection_string
# GEMINI_API_KEY=your_gemini_api_key
# BLOB_READ_WRITE_TOKEN=your_vercel_blob_token   (required for driver CNIC/License document uploads)
# (never commit this file — it's already covered by .gitignore)

# 4. Seed the knowledge base (hotels, POIs, restaurants, safety advisories)
# Note: scripts/seed.ts reads from ./data/raw by default. It also checks an
# optional external ../rag-knowledge sibling directory for extended data —
# that folder is not included in this repo. If it's missing, seeding still
# runs fine using the datasets bundled in data/raw; the external folder is
# only needed to sync additional/updated source data.
npx tsx scripts/seed.ts

# 5. Run the development server
npm run dev

# App will be available at http://localhost:3000
```

---

## 🧠 Engineering Notes & Known Limitations

**Strengths**
- Clear separation of real-time (Firestore) vs. knowledge-base (Postgres) data — a deliberate architectural choice for scalability
- Framer Motion transitions give the web app a native-app feel on mobile
- RAG design avoids AI hallucination on high-stakes facts (contact numbers, road safety) by grounding responses in verified data rather than model memory

**Known limitations / next steps**
- `useAppViewModel.ts` currently centralizes a lot of state; splitting into `useRideManager`, `useChatManager`, and `useAuthManager` would improve maintainability at scale
- Heavy views (e.g. `TrackRideView`, `FinancialReportView`) are not yet code-split with `next/dynamic`, which affects initial load time
- The seeding script (`scripts/seed.ts`) doesn't yet validate incoming data with Zod — malformed CSV rows could otherwise degrade AI answer quality
- Live weather and real-time road-closure updates are not yet integrated; the current safety advisory data is a curated static reference table, refreshed manually rather than pulled from a live feed

---

## 👤 Author

Muhammad Noman Ashraf — BS Computer Science, University of Gujrat
GitHub: [noman-code-droid](https://github.com/noman-code-droid)
