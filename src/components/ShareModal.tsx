import React, { useState } from 'react';
import { Conversation } from '../types';
import { X, Copy, Check, Download, Share2, FileText, Code } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  conversation,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !conversation) return null;

  const getMarkdownContent = () => {
    let md = `# ${conversation.title}\n\n`;
    md += `*ZOIR AI bilan suhbat - ${new Date(conversation.createdAt).toLocaleDateString()}*\n\n---\n\n`;

    conversation.messages.forEach((m) => {
      const sender = m.role === 'user' ? '**Foydalanuvchi**' : '**ZOIR AI**';
      md += `### ${sender}\n\n${m.content}\n\n`;
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(getMarkdownContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = getMarkdownContent();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(conversation, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2e2e2e]">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-[#10A37F]" />
            <h3 className="font-semibold text-sm text-white">Suhbatni ulashish & eksport</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2c2c2c] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-[#141414] border border-[#2d2d2d]">
            <div className="text-xs text-neutral-400 mb-1">Suhbat mavzusi:</div>
            <div className="text-sm font-medium text-white truncate">{conversation.title}</div>
            <div className="text-xs text-neutral-500 mt-1">
              Jami xabarlar soni: {conversation.messages.length} ta
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center justify-between p-3 rounded-xl bg-[#252525] hover:bg-[#2e2e2e] border border-[#383838] text-xs text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Copy className="h-4 w-4 text-[#10A37F]" />
                <span className="font-medium">Markdown sifatida nusxa olish</span>
              </div>
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <Check className="h-3.5 w-3.5" /> Nusxalandi
                </span>
              ) : (
                <span className="text-neutral-400">Nusxalash</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="flex items-center justify-between p-3 rounded-xl bg-[#252525] hover:bg-[#2e2e2e] border border-[#383838] text-xs text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-blue-400" />
                <span className="font-medium">Fayl sifatida yuklab olish (.md)</span>
              </div>
              <Download className="h-4 w-4 text-neutral-400" />
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex items-center justify-between p-3 rounded-xl bg-[#252525] hover:bg-[#2e2e2e] border border-[#383838] text-xs text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Code className="h-4 w-4 text-purple-400" />
                <span className="font-medium">JSON formatida saqlash (.json)</span>
              </div>
              <Download className="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-[#2e2e2e] bg-[#171717]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
