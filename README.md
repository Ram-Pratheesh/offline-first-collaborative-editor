# CollabX — Offline-First Collaborative Editor & Inspection Workspace

**CollabX** is a modern, offline-first collaborative application that combines a rich text note editor with a powerful Inspection Workspace. Built with resilience in mind, CollabX uses CRDTs (Conflict-free Replicated Data Types) to guarantee zero data loss and seamless offline functionality, enhanced by intelligent AI semantic analysis.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Gemini API key
- Google Cloud Console project (for OAuth)
- [Ollama](https://ollama.com/) (Optional: for local Llama 3.2 3B semantic analysis)

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
- `GEMINI_MODEL` — e.g. `gemini-3.8-flash`

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

---

## 🎥 Demo Video

This repository uses **Git LFS** to store large media files.
You can find a complete demonstration of CollabX's offline-first collaborative features and the AI semantic conflict resolution in:
`T064_DemoVideo.mp4` *(106MB)*

*(Ensure you have `git lfs` installed to pull the video file successfully).*

---

## 🔑 Core Features

### Offline-First Collaboration
- **Yjs CRDTs**: Guarantees zero data loss and eventual consistency across multiple users. No merge conflicts.
- **IndexedDB Persistence**: Edit documents and inspection reports seamlessly while entirely offline. Changes are saved locally.
- **Auto-Sync on Reconnect**: Offline changes are automatically synced and merged the moment internet connectivity is restored.

### AI-Powered Semantic Analysis & Summaries
- **Reconnection Summaries**: AI automatically reads the merged CRDT state and generates a narrative "story" of what collaborators changed while you were away.
- **Observation Semantic Checks**: When multiple inspectors take notes on the same location, the backend runs Semantic Analysis to identify:
  - `AGREEMENT`: Notes that match.
  - `CONTRADICTION`: Conflicting notes (e.g., "fan works" vs "fan is broken").
  - `DUPLICATE`: Redundant observations.
  - `NO_RELATION`: Independent notes.
- **Hybrid AI Pipeline**: Uses Gemini (3.8-flash) as the primary cloud intelligence, with robust retry logic, fallbacks, and support for local Ollama instances.

### Modern Workspaces
- **Document Editor**: Rich text editing via TipTap v3.
- **Inspection Workspace**: Organize field notes by locations, tag them with connectivity states, and run semantic reconciliation.
- **Metrics Dashboard**: Monitor system health, sync latency, IndexedDB storage usage, and AI summary timing.
- **Authentication**: Secure Google OAuth and Email login.

---

## 🏗️ Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | React, TypeScript, Vite, Tailwind CSS v4 |
| Editor | TipTap v3 |
| Animations | Framer Motion |
| State | Zustand, React Query |
| CRDT Sync | Yjs, y-indexeddb, y-websocket |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, Google OAuth |
| Cloud AI | Gemini API (`gemini-3.8-flash`) |
| Local AI | Ollama (`llama3.2:3b`) |

---

## 📁 Project Structure

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI components (Shared, Inspection, Editor)
│   │   ├── pages/          # Page components (Editor, Workspace, Metrics)
│   │   ├── editor/         # TipTap editor config
│   │   ├── sync/           # Yjs synchronization & WebSockets
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript interfaces
├── server/                 # Express Backend
│   ├── src/
│   │   ├── config/         # DB & env config
│   │   ├── controllers/    # Route handlers (AI, Inspections, Auth)
│   │   ├── models/         # Mongoose schemas (Observations, SemanticResults)
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (AI Summary, Semantic Reconciliation)
│   │   └── websocket/      # Yjs WebSocket server
└── README.md
```
