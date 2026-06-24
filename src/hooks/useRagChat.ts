import { useState, useCallback, useEffect, useMemo } from "react";

export interface Agent {
  id: string;
  name: string;
}

export interface SourceNode {
  id: string;
  score: number;
  text: string;
  url?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceNode[];
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  updatedAt: number;
  sessionId?: string;
}

const STORAGE_KEY = "rag-conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function useRagChat() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load agents from server
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/agents`)
      .then((r) => r.json())
      .then((data: Agent[]) => {
        setAgents(data);
        if (data.length > 0) setSelectedAgentId(data[0].id);
      })
      .catch(console.error);
  }, []);

  // Hydrate conversations from localStorage
  useEffect(() => {
    setConversations(loadConversations());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, hydrated]);

  const messages = useMemo(
    () => conversations.find((c) => c.id === currentConvId)?.messages ?? [],
    [conversations, currentConvId]
  );

  const newChat = useCallback(() => setCurrentConvId(null), []);
  const selectConversation = useCallback((id: string) => setCurrentConvId(id), []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConvId === id) setCurrentConvId(null);
    },
    [currentConvId]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };

      let convId = currentConvId;
      const agentId = convId
        ? (conversations.find((c) => c.id === convId)?.agentId ?? selectedAgentId)
        : selectedAgentId;

      if (!convId) {
        convId = crypto.randomUUID();
        const title = text.length > 50 ? text.slice(0, 50) + "…" : text;
        setConversations((prev) => [
          { id: convId!, title, agentId, messages: [], updatedAt: Date.now() },
          ...prev,
        ]);
        setCurrentConvId(convId);
      }

      const existingSessionId = conversations.find((c) => c.id === convId)?.sessionId;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, userMsg], updatedAt: Date.now() }
            : c
        )
      );
      setIsLoading(true);

      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            agent_id: agentId,
            ...(existingSessionId ? { session_id: existingSessionId } : {}),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          answer: string;
          sources: { title: string; doc_id: string; score: number }[];
          session_id?: string;
        };

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          sources: data.sources.map((s) => ({
            id: s.doc_id,
            score: s.score,
            text: s.title,
            url: `https://arxiv.org/abs/${s.doc_id}`,
          })),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, assistantMsg],
                  updatedAt: Date.now(),
                  ...(data.session_id ? { sessionId: data.session_id } : {}),
                }
              : c
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentConvId, conversations, selectedAgentId]
  );

  return {
    agents,
    selectedAgentId,
    setSelectedAgentId,
    messages,
    isLoading,
    sendMessage,
    conversations,
    currentConvId,
    newChat,
    selectConversation,
    deleteConversation,
  };
}
