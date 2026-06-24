import { useRef, useEffect } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRagChat, type Message } from "../hooks/useRagChat";
import { Sidebar } from "./Sidebar";
import { ChatInputBar } from "./ChatInputBar";
import { SourcesDisplay } from "./SourcesDisplay";

const MD: Components = {
  ul: ({ node: _n, ...p }) => <ul className="list-disc pl-5 mb-2 space-y-0.5" {...p} />,
  ol: ({ node: _n, ...p }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5" {...p} />,
  li: ({ node: _n, ...p }) => <li className="leading-relaxed" {...p} />,
  p:  ({ node: _n, ...p }) => <p className="mb-2 last:mb-0" {...p} />,
  h1: ({ node: _n, ...p }) => <h1 className="text-lg font-semibold mt-3 mb-1.5" {...p} />,
  h2: ({ node: _n, ...p }) => <h2 className="text-base font-semibold mt-2.5 mb-1" {...p} />,
  h3: ({ node: _n, ...p }) => <h3 className="font-semibold mt-2 mb-0.5" {...p} />,
  strong: ({ node: _n, ...p }) => <strong className="font-semibold" {...p} />,
  a: ({ node: _n, ...p }) => (
    <a className="text-[#3dba8c] underline hover:text-[#35a87d]" target="_blank" {...p} />
  ),
  pre: ({ node: _n, ...p }) => (
    <pre className="mb-2 bg-[#f7f7f7] border border-[#e4e4e4] rounded-lg p-3 overflow-x-auto text-sm font-mono" {...p} />
  ),
  code: ({ node: _n, className, children, ...p }) => {
    const isBlock = /language-/.test(className ?? "");
    return isBlock ? (
      <code className={className} {...p}>{children}</code>
    ) : (
      <code className="bg-[#f0faf6] border border-[#c6ead9] rounded px-1 py-0.5 text-[0.8em] font-mono text-[#1a5c40]" {...p}>{children}</code>
    );
  },
  blockquote: ({ node: _n, ...p }) => (
    <blockquote className="border-l-2 border-[#3dba8c] pl-3 text-[#6b7280] italic my-2" {...p} />
  ),
};

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-3xl bg-[#3dba8c] px-4 py-2.5 text-sm text-white leading-relaxed shadow-sm">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ message }: { message: Message }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3dba8c] text-[10px] font-bold text-white shadow-sm">
        AI
      </div>
      <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-sm border border-[#e8e8e8] px-4 py-3 shadow-sm">
        <div className="text-sm text-[#1a1a1a] leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{message.content}</ReactMarkdown>
        </div>
        {message.sources && <SourcesDisplay sources={message.sources} />}
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3dba8c] text-[10px] font-bold text-white shadow-sm">
        AI
      </div>
      <div className="flex items-center gap-1.5 bg-white rounded-2xl rounded-tl-sm border border-[#e8e8e8] px-4 py-3 shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3dba8c] animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#3dba8c] animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#3dba8c] animate-bounce" />
      </div>
    </div>
  );
}

function EmptyState({ onSend, isLoading }: { onSend: (t: string) => void; isLoading: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-24">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3dba8c] shadow-lg">
          <span className="text-lg font-bold text-white">AI</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">
          Ready when you are.
        </h1>
        <p className="text-sm text-[#9ca3af]">
          Ask anything about your documents
        </p>
      </div>
      <div className="w-full max-w-2xl">
        <ChatInputBar onSend={onSend} isLoading={isLoading} />
        <p className="mt-2 text-center text-xs text-[#b0b0b0]">
          Press <kbd className="rounded bg-[#f0f0f0] px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send,{" "}
          <kbd className="rounded bg-[#f0f0f0] px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

function MessageThread({ messages, isLoading, onSend }: {
  messages: Message[];
  isLoading: boolean;
  onSend: (t: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <UserMessage key={msg.id} content={msg.content} />
            ) : (
              <AssistantMessage key={msg.id} message={msg} />
            )
          )}
          {isLoading && <LoadingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-[#e8e8e8] bg-[#f8f8f8] px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <ChatInputBar onSend={onSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  const {
    agents, selectedAgentId, setSelectedAgentId,
    messages, isLoading, sendMessage,
    conversations, currentConvId, newChat, selectConversation, deleteConversation,
  } = useRagChat();

  return (
    <div className="flex h-screen bg-[#f0f0f0]">
      <Sidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
        conversations={conversations}
        currentConvId={currentConvId}
        onNewChat={newChat}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
      />
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        {messages.length === 0 ? (
          <EmptyState onSend={sendMessage} isLoading={isLoading} />
        ) : (
          <MessageThread messages={messages} isLoading={isLoading} onSend={sendMessage} />
        )}
      </div>
    </div>
  );
}
