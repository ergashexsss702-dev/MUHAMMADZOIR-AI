import React, { useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Split content by code blocks to give them sleek interactive UI
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'kod',
      content: match[2].trimEnd(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const renderMarkdownText = (text: string) => {
    try {
      const html = marked.parse(text, { breaks: true, gfm: true }) as string;
      return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
      return <div className="markdown-body whitespace-pre-wrap">{text}</div>;
    }
  };

  if (parts.length === 0) {
    return renderMarkdownText(content);
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <div key={index}>{renderMarkdownText(part.content)}</div>;
        }

        const isCopied = copiedCodeIndex === index;

        return (
          <div
            key={index}
            className="my-3 overflow-hidden rounded-xl border border-[#333333] bg-[#0d0d0d] shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-[#262626] bg-[#1a1a1a] px-4 py-2 text-xs font-mono text-neutral-400">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                {part.language || 'kod'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(part.content, index)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-neutral-300 hover:bg-[#2c2c2c] hover:text-white transition-colors cursor-pointer"
                title="Kodni nusxalash"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-sans">Nusxa olindi!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="font-sans">Nusxa olish</span>
                  </>
                )}
              </button>
            </div>
            <div className="overflow-x-auto p-4 text-[13.5px] font-mono leading-relaxed text-[#f0f0f0]">
              <pre>
                <code>{part.content}</code>
              </pre>
            </div>
          </div>
        );
      })}
    </div>
  );
};
