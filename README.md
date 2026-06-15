# Hybrid Rendering Admin Dashboard

A full-stack product management dashboard built with Next.js (App Router), Node.js / Express, and MongoDB.

**Live Demo:** `https://hybrid-dashboard-eight.vercel.app`
**Loom Walkthrough:** `https://www.loom.com/share/9136e4a2364b49ba971940eb124cfd42`

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Sonner
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Database:** MongoDB Atlas
- **Deployment:** Vercel (frontend), Render (backend)

---

## Architecture Decision — Server vs Client Components

The product list page uses a **hybrid architecture**:

- **`app/products/page.tsx` — Server Component**
  Fetches the first page of products on the server so that product names appear in the raw HTML (`View Page Source`). This satisfies the SSR requirement for SEO and fast first paint. No `use client` here.

- **`ProductsClient.tsx` — Client Component**
  Owns all interactive state: search input, category/status filters, pagination, and stock toggles. Re-fetches from the Express API on the client as filters change — without a full page reload. The URL is kept in sync via `router.replace` so results are shareable and bookmarkable.

This split means the first render is server-side (good for SEO), and all subsequent interactions are client-side (good for UX) — without fetching data twice.

---

## Section 5 Features Implemented

### 5.1 — Race Condition Fix (AbortController)
When a user types quickly, multiple requests can be in flight. The most recent request cancels the previous one using `AbortController`. A sequence number guard also ensures that if an older response somehow resolves after a newer one, it is silently discarded. This guarantees the UI always shows the result of the latest request.

### 5.2 — Optimistic UI with Rollback (Stock Toggle)
The stock toggle on each product card updates the UI immediately before the server responds. If the API call fails (testable via `?simulateError=true`), the UI rolls back to the previous stock value and shows a toast error. This makes the UI feel instant while still being consistent with the server's source of truth on failure.

### 5.3 — Live Category Counts via Aggregation
Each category in the filter dropdown shows a live count of matching products (e.g., `Footwear (12)`). Counts are computed server-side using a MongoDB `$match / $group` aggregation pipeline — not by fetching all products and counting in JS. The counts respect the currently active search term and stock status filter, so they always reflect the filtered subset, not the whole catalog.

---

## Running Locally

### Prerequisites

- Node.js 18+
- A MongoDB Atlas account (free tier is fine)

### 1. Clone the repo

```bash
git clone https://github.com/rishabhraikwar98/Hybrid_Dashboard.git
cd Hybrid-Dashboard
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Seed the database:

```bash
npm run seed
```

Start the server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List products — supports `page`, `limit`, `search`, `category`, `status` |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product (includes optimistic locking via `version`) |
| PATCH | `/api/products/:id/stock` | Toggle stock (supports `?simulateError=true`) |
| DELETE | `/api/products/:id` | Delete product |

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Port to run Express on (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Allowed CORS origin (your Vercel URL in production) |

### Frontend (`client/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Express backend |

---

## Deployment

- **Frontend** deployed on [Vercel](https://vercel.com) — set `NEXT_PUBLIC_API_URL` to your Render backend URL in Vercel environment variables.
- **Backend** deployed on [Render](https://render.com) — set all `server/.env` variables in Render's environment settings. Set `FRONTEND_URL` to your Vercel URL.
- **Database** hosted on [MongoDB Atlas](https://www.mongodb.com/atlas).

---

## Use of AI Tools

Claude was used throughout this project for scaffolding, debugging, and understanding concepts (particularly the Server/Client Component split and the Section 5 advanced features). Every line of code has been reviewed and understood — the architecture decisions, the AbortController race condition fix, the optimistic UI rollback logic, and the MongoDB aggregation pipeline were all reasoned through deliberately, not copy-pasted blindly.

---
