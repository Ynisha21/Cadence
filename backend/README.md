# Productivity Platform – Backend API

Express + MongoDB (Mongoose) + JWT. Modules: auth, tasks, analytics, AI assistant, CSV export.

## Quick start
```bash
npm install
cp .env.example .env     # fill MONGO_URI and JWT_SECRET (ANTHROPIC_API_KEY optional)
npm run seed             # optional: demo@example.com / Password123 with ~90 tasks
npm run dev              # http://localhost:5000/api/health
npm test                 # unit tests (no DB needed)
```

## Endpoints (all except auth/health need `Authorization: Bearer <token>`)
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | returns `{ token, user }` |
| GET | /api/auth/me | logout = client discards the token |
| POST/GET | /api/tasks | list filters: `status priority category search from to dueFrom dueTo overdue=true sortBy(dueDate\|createdAt\|priority) order page limit` |
| GET/PUT/PATCH/DELETE | /api/tasks/:id | owner-only (others get 404) |
| GET | /api/analytics/overview, trends, categories, priorities, deadlines, report | params: `range=7d\|30d\|90d` or `from`,`to`; `category priority status`; trends `unit=day\|week\|month`; deadlines `days` |
| POST | /api/ai/prioritize, /plan, /summary | body (all optional): `taskIds, maxTasks, availableHours, range` |
| GET | /api/reports/tasks/export | CSV; accepts the same filters as the task list |

## KPI definitions
- **Scope:** overview, categories, priorities and deadline rates use tasks *created* in the range. Trends and productivity change use `completedAt`. `overdueNow` / `upcoming` lists are current-state and ignore the range.
- **Completion rate** = completed ÷ total × 100 (0 when no tasks).
- **Overdue** = has a due date in the past and status ≠ Completed.
- **On-time rate** = completed with `completedAt ≤ dueDate` ÷ completed tasks having a due date (`null` when none → show empty state).
- **Avg completion time** = mean(`completedAt − createdAt`) in hours — elapsed time, not work time.
- **Productivity change** = completions in range vs the equal-length previous range; `percent` is `null` if the previous period had 0.

## Security notes
bcrypt-hashed passwords · JWT auth middleware · every task query includes `userId` · zod validation on all inputs (also blocks NoSQL operator injection) · helmet, CORS allow-list, rate limits (auth + AI) · CSV formula-injection guard · AI key server-side only; only titles/priority/status/category/due date of the user's own open tasks are sent to the AI · AI never modifies tasks · rule-based fallback if AI is unavailable.

## AI design
Ranking is deterministic (`services/prioritizer.js`: overdue > due soon > priority > in-progress); the model only explains it. Metrics for summaries come from the analytics service.
