# CollabEdit — Offline-First Collaborative Document Editor

A modern collaborative note editor with offline-first synchronization using CRDTs (Yjs) and AI-powered change summaries.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Gemini API key
- Google Cloud Console project (for OAuth)

### 1. Setup Server

```bash
cd server
npm install
```

Edit `server/.env` and fill in your values:
- `MONGODB_URI` — Your MongoDB connection string
- `JWT_SECRET` — Any long random string
- `JWT_REFRESH_SECRET` — Another long random string
- `GOOGLE_CLIENT_ID` — From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- `GEMINI_API_KEY` — From Google AI Studio

Start the server:
```bash
npm run dev
```

### 2. Setup Client

```bash
cd client
npm install
```

Edit `client/.env` if needed (defaults work for local dev).

Start the client:
```bash
npm run dev
```

### 3. Open the App

Visit `http://localhost:5173`

## 🏗️ Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | React, TypeScript, Vite, Tailwind CSS v4 |
| Editor | TipTap v3 |
| Animations | Framer Motion |
| State | Zustand, React Query |
| CRDT Sync | Yjs, y-indexeddb |
| Realtime | WebSocket |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, Google OAuth |
| AI | Gemini API |

## 📁 Project Structure

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── editor/         # TipTap editor config
│   │   ├── sync/           # Yjs synchronization
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Root component
│   └── ...
├── server/                 # Express Backend
│   ├── src/
│   │   ├── config/         # DB & env config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (AI)
│   │   ├── websocket/      # Yjs WebSocket server
│   │   └── index.ts        # Entry point
│   └── ...
└── README.md
```

## 🔑 Features

- ✅ Email & Google OAuth authentication
- ✅ Rich text editor (TipTap)
- ✅ Real-time collaboration (Yjs CRDT)
- ✅ Offline-first editing (IndexedDB)
- ✅ Automatic sync on reconnect
- ✅ AI-powered change summaries (Gemini)
- ✅ Document sharing & permissions
- ✅ Version history
- ✅ Modern dark mode UI
- ✅ Responsive design
