import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";
import { join } from "path";

interface Agent {
  id: string;
  name: string;
  url: string;
  apiKey: string;
}

function loadAgents(): Agent[] {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "agents.json"), "utf8")) as Agent[];
  } catch {
    console.warn("[vite] agents.json not found — copy agents.json.example to get started");
    return [];
  }
}

function apiPlugin(agents: Agent[]): Plugin {
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return {
    name: "api-middleware",
    configureServer(server) {
      // GET /api/agents
      server.middlewares.use("/api/agents", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(agents.map(({ id, name }) => ({ id, name }))));
      });

      // POST /api/chat
      server.middlewares.use("/api/chat", (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }

        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
          void (async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString()) as {
                prompt: string;
                session_id?: string;
                agent_id?: string;
              };

              const agent = agentMap[body.agent_id ?? ""] ?? agents[0];
              if (!agent) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "no agents configured" }));
                return;
              }

              const payload: Record<string, string> = { prompt: body.prompt };
              if (body.session_id) payload.session_id = body.session_id;

              const upstream = await fetch(agent.url, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `ApiKey ${agent.apiKey}`,
                },
                body: JSON.stringify(payload),
              });

              if (!upstream.ok) {
                const text = await upstream.text();
                res.statusCode = 502;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: `Backend: ${upstream.status} ${text}` }));
                return;
              }

              const data = (await upstream.json()) as {
                answer?: string;
                sources?: unknown[];
                session_id?: string;
              };
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({
                answer: data.answer ?? "",
                sources: data.sources ?? [],
                session_id: data.session_id,
              }));
            } catch (err) {
              console.error("[api-middleware]", err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: "Internal server error" }));
            }
          })();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin(loadAgents())],
});
