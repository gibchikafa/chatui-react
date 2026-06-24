import { ExternalLink } from "lucide-react";
import type { SourceNode } from "../hooks/useRagChat";

export function SourcesDisplay({ sources }: { sources: SourceNode[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-4 border-t border-[#f0f0f0] pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#b0b0b0]">
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((node) => (
          <a
            key={node.id}
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex max-w-[260px] items-start gap-2 rounded-xl border border-[#e8e8e8] bg-[#f9f9f9] px-3 py-2 text-xs transition-colors hover:border-[#3dba8c]/40 hover:bg-[#f0faf6]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-[#374151] group-hover:text-[#1a1a1a]">
                {node.text}
              </p>
              <p className="mt-0.5 font-mono text-[#b0b0b0]">
                {node.id} · {Math.round(node.score * 100)}%
              </p>
            </div>
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-[#d1d5db] group-hover:text-[#3dba8c]" />
          </a>
        ))}
      </div>
    </div>
  );
}
