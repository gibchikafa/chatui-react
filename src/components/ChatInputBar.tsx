import { useState, useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInputBar({ onSend, isLoading, placeholder = "Ask anything" }: ChatInputBarProps) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 48), 128)}px`;
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || isLoading) return;
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "48px";
    onSend(text);
  };

  return (
    <form
      className="flex items-end gap-2 rounded-2xl border border-[#e4e4e4] bg-white px-4 py-3 shadow-sm transition-shadow focus-within:border-[#3dba8c]/50 focus-within:shadow-md"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={textareaRef}
        className="flex-1 resize-none border-0 bg-transparent p-0 text-sm text-[#1a1a1a] placeholder:text-[#9ca3af] focus-visible:outline-none min-h-12 max-h-32 overflow-y-auto leading-relaxed"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          requestAnimationFrame(resize);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={isLoading || !draft.trim()}
        className="shrink-0 self-end h-8 w-8 rounded-full bg-[#3dba8c] hover:bg-[#35a87d] disabled:bg-[#e8e8e8] disabled:text-[#b0b0b0] transition-colors inline-flex items-center justify-center"
        aria-label="Send"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <ArrowUp className="h-4 w-4 text-white disabled:text-[#b0b0b0]" />
        )}
      </button>
    </form>
  );
}
