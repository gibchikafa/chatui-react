import { useState } from "react";
import { Plus, Search, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import type { Agent, Conversation } from "../hooks/useRagChat";

interface SidebarProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  conversations: Conversation[];
  currentConvId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function Sidebar({
  agents,
  selectedAgentId,
  onSelectAgent,
  conversations,
  currentConvId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (collapsed) {
    return (
      <div className="flex h-screen w-12 shrink-0 flex-col items-center border-r border-[#e8e8e8] bg-white py-3 gap-1">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-lg p-2 text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#1a1a1a] transition-colors"
          title="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>
        <button
          onClick={onNewChat}
          className="rounded-lg p-2 text-[#9ca3af] hover:bg-[#f5f5f5] hover:text-[#3dba8c] transition-colors"
          title="New chat"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-64 shrink-0 flex-col border-r border-[#e8e8e8] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#f2f2f2]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#3dba8c] shadow-[0_0_6px_#3dba8c80]" />
          <span className="text-sm font-semibold text-[#1a1a1a] tracking-tight">
            RAG Agent
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-lg p-1.5 text-[#b0b0b0] hover:bg-[#f5f5f5] hover:text-[#6b7280] transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Agent selector */}
      {agents.length > 0 && (
        <div className="px-3 py-2 border-b border-[#f2f2f2]">
          {agents.length === 1 ? (
            <p className="text-xs text-[#9ca3af] font-mono truncate">{agents[0].name}</p>
          ) : (
            <select
              value={selectedAgentId}
              onChange={(e) => onSelectAgent(e.target.value)}
              className="w-full text-sm text-[#374151] bg-[#f5f5f5] border border-[#e4e4e4] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#3dba8c] focus:ring-1 focus:ring-[#3dba8c]/20 cursor-pointer"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-2 pt-2 space-y-0.5">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#374151] hover:bg-[#f0faf6] hover:text-[#3dba8c] transition-colors"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#9ca3af] hover:bg-[#f5f5f5] transition-colors">
          <Search className="h-4 w-4" />
          Search chats
        </button>
      </div>

      {/* Conversation list */}
      <div className="mt-4 flex-1 overflow-y-auto px-2">
        {conversations.length > 0 && (
          <>
            <p className="mb-1.5 px-3 text-xs font-medium uppercase tracking-widest text-[#b0b0b0]">
              Recents
            </p>
            <ul className="space-y-0.5">
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <div
                    className={`group relative flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                      conv.id === currentConvId
                        ? "bg-[#f0faf6] text-[#3dba8c] font-medium"
                        : "text-[#374151] hover:bg-[#f5f5f5]"
                    }`}
                    onClick={() => onSelectConversation(conv.id)}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {conv.id === currentConvId && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-[#3dba8c]" />
                    )}
                    <span className="flex-1 truncate pr-6">{conv.title}</span>
                    {hoveredId === conv.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="absolute right-2 rounded p-0.5 text-[#b0b0b0] hover:bg-[#fee2e2] hover:text-[#ef4444] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#f2f2f2] px-4 py-3">
        <p className="text-xs text-[#b0b0b0] font-mono">Hopsworks RAG Bench</p>
      </div>
    </div>
  );
}
