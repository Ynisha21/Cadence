# Cadence – Frontend

React 18 + Vite, React Router, Recharts, lucide-react. Plain CSS with design tokens (light and dark themes).

## Run
```bash
npm install
npm run dev        # http://localhost:5173  (proxies /api to http://localhost:5000)
npm run build      # production build in dist/
```
Start the backend first (`npm run dev` in `backend/`, optionally `npm run seed`), then log in with
`demo@example.com` / `Password123` (button on the login page).

For production set `VITE_API_URL` (see `.env.example`) to your deployed API, e.g. `https://api.example.com/api`,
and add the frontend origin to `CLIENT_URL` in the backend `.env`.

## Pages
| Route | What it does |
|---|---|
| `/` | Landing page |
| `/login`, `/register` | Auth (JWT stored in localStorage) |
| `/dashboard` | Hero with completion ring, KPI cards, trend chart, status donut, due-soon and overdue lists with one-tap complete |
| `/tasks` | Search, status/priority/category filters, sorting, pagination, create/edit/delete, quick complete |
| `/analytics` | Range (7/30/90 days or custom), category/priority/status filters, trend by day/week/month, category and priority charts, 90-day heatmap |
| `/assistant` | Prioritize, daily plan and summary (AI explanation with rule-based fallback) |
| `/reports` | Filtered preview and CSV download |

## Responsive behaviour
Desktop: fixed sidebar. At 900px and below: top bar plus bottom tab navigation. Cards, charts, tables and forms reflow to a single column on phones.
Keyboard focus is visible, charts have text alternatives, and animations respect `prefers-reduced-motion`.
