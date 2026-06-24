import "dotenv/config";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT) || 3001;

// Load agents: agents.json takes priority, env vars are the fallback
function loadAgents() {
  try {
    const parsed = JSON.parse(readFileSync(join(__dirname, "agents.json"), "utf8"));
    if (parsed.length > 0) return parsed;
  } catch {}

  const url = process.env.BACKEND_AGENT_URL;
  const apiKey = process.env.BACKEND_AGENT_API_KEY;
  if (url && apiKey) {
    return [{
      id: process.env.AGENT_ID || "default",
      name: process.env.AGENT_NAME || "RAG Agent",
      url,
      apiKey,
    }];
  }

  console.error("No agents configured. Provide agents.json or set BACKEND_AGENT_URL and BACKEND_AGENT_API_KEY in .env");
  process.exit(1);
}

const agents = loadAgents();

const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

const app = express();
app.use(express.json());

// Return public agent list (no secrets)
app.get("/api/agents", (_req, res) => {
  res.json(agents.map(({ id, name }) => ({ id, name })));
});

app.post("/api/chat", async (req, res) => {
  const { prompt, session_id, agent_id } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt is required" });
  }

  const agent = agentMap[agent_id] ?? agents[0];
  if (!agent) {
    return res.status(400).json({ error: "no agents configured" });
  }

  const body = { prompt };
  if (session_id) body.session_id = session_id;

  try {
    const response = await fetch(agent.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${agent.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Backend: ${response.status} ${text}` });
    }

    const data = await response.json();
    return res.json({
      answer: data.answer ?? "",
      sources: data.sources ?? [],
      session_id: data.session_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Serve built frontend in production
const distPath = join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
