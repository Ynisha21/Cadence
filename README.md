# Cadence: Task Management & Productivity Intelligence Platform

A full-stack MERN app that turns task data into productivity metrics, charts and AI-assisted planning.

## Features
- Secure sign-up and login (JWT, hashed passwords)
- Task management with filters, search, sorting and pagination
- Dashboard with KPIs: completion rate, overdue, on-time rate
- Analytics: trends, category and priority charts, activity heatmap
- AI assistant (rule-based ranking explained by Gemini)
- CSV export, dark mode, responsive design

## Tech stack
React, Vite, Recharts · Node.js, Express · MongoDB Atlas, Mongoose · JWT, bcrypt, zod · Google Gemini API

## Run locally
**Backend**
cd backend
npm install
copy .env.example .env     (then fill in the values)
npm run seed
npm run dev

**Frontend**
cd frontend
npm install
npm run dev

Open http://localhost:5173. Demo login: demo@example.com / Password123 (after seeding).

## Screenshots
<img width="1591" height="782" alt="Screenshot 2026-11-17 222638" src="https://github.com/user-attachments/assets/c63638ea-4067-4aff-8d6b-d6381bcafdbe" />
<img width="1352" height="866" alt="Screenshot 2026-11-17 222648" src="https://github.com/user-attachments/assets/6217535b-4438-4063-969f-64ac7ed10985" />
<img width="1910" height="902" alt="Screenshot 2026-11-17 222535" src="https://github.com/user-attachments/assets/3e80f2f1-2a22-42ce-bd63-c1aba17328a8" />



