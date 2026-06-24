# chatui-react

A pure React + Vite chat UI for RAG agents, styled with the Hopsworks design language. Supports multiple agent backends via a simple JSON config file.

## Features

- Multi-agent support — switch between backends from the sidebar
- Conversation history persisted in localStorage
- Markdown rendering with lists, tables, code blocks, and more
- Hopsworks theme (teal accent, clean cards, light gray background)
- API keys stay server-side — never exposed to the browser

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure your agents

```bash
cp agents.json.example agents.json
```

Edit `agents.json` with your backend URLs and API keys:

```json
[
  {
    "id": "llamaindex",
    "name": "LlamaIndex RAG",
    "url": "http://your-host/v1/endpoint",
    "apiKey": "your-api-key"
  },
  {
    "id": "langgraph",
    "name": "LangGraph RAG",
    "url": "http://your-host/v1/endpoint",
    "apiKey": "your-api-key"
  }
]
```

All backends must accept `POST { prompt, session_id? }` and return `{ answer, sources?, session_id? }`.

### 3. Run in development

```bash
pnpm dev
```

Starts the Vite dev server (default port 5173). The `/api/chat` and `/api/agents` endpoints are handled by a Vite middleware — no separate server needed.

### 4. Run in production

```bash
pnpm build
pnpm start
```

The Express server in `server.js` serves the built frontend and handles the API proxy. Set `PORT` in a `.env` file to change the port (default 3001).

```bash
cp .env.example .env
# edit PORT if needed
```

## Project structure

```
agents.json         # your backend config (gitignored)
agents.json.example # template
server.js           # Express server for production
vite.config.ts      # Vite config + dev API middleware
src/
  components/
    Chat.tsx         # main layout, message rendering
    Sidebar.tsx      # conversation list + agent selector
    ChatInputBar.tsx # textarea + send button
    SourcesDisplay.tsx # source citations
  hooks/
    useRagChat.ts    # state, API calls, localStorage
  App.tsx
  main.tsx
  index.css
```

## Agent API contract

Every backend listed in `agents.json` must implement:

**Request**
```
POST <url>
Authorization: ApiKey <apiKey>
Content-Type: application/json

{ "prompt": "...", "session_id": "<optional>" }
```

**Response**
```json
{
  "answer": "...",
  "session_id": "...",
  "sources": [
    { "title": "...", "doc_id": "...", "score": 0.95 }
  ]
}
```
