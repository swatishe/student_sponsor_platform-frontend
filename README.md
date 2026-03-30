# Student Sponsor Platform — Frontend

React + Vite

---

## Overview
Frontend for the Student Sponsor Platform (SSP). Provides UI for students, sponsors, and faculty to interact with the system.

---

## Tech Stack
- React (Vite)
- Axios
- React Router
- WebSockets

---

## Local Setup

### 1. Clone Repository
git clone <repo-url>
cd frontend

### 2. Install Dependencies
npm install

### 3. Configure Environment Variables (.env)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

### 4. Run Development Server
npm run dev

---

## Local URL
http://localhost:5173

---

## Build
npm run build

Output folder: dist/

---

## Deployment (Vercel)

### Steps
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   VITE_API_URL=https://your-backend.onrender.com
   VITE_WS_URL=wss://your-backend.onrender.com
4. Deploy

---

## Notes
- Backend must be running for API calls
- Ensure CORS is configured correctly
- WebSocket requires valid authentication token