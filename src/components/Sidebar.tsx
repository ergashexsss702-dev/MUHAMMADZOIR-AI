import React, { useState } from 'react';
import { Conversation } from '../types';
import { 
  Plus, 
  MessageSquare, 
  Pin, 
  Trash2, 
  Edit2, 
  Settings, 
  Search, 
  Check, 
  X, 
  Bot, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onPinConversation,
  onRenameConversation,
  onClearAll,
  isOpen,
  onToggleOpen,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const regularConversations = filteredConversations.filter((c) => !c.isPinned);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 bg-[#171717] border-r border-[#262626] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${!isOpen && 'md:hidden'}`}
      >
        {/* Top Header & New Chat */}
        <div className="p-3.5 space-y-3 border-b border-[#262626]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-1">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-[#10A37F] to-[#2cd8a3] flex items-center justify-center text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-white">ZOIR AI</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                v1.0
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleOpen}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#262626] md:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333333] hover:border-[#10A37F]/50 text-sm font-medium text-white shadow-sm transition-all cursor-pointer group"
          >
            <Plus className="h-4 w-4 text-[#10A37F] group-hover:scale-110 transition-transform" />
            <span>Yangi suhbat</span>
          </button>

          {/* Search conversations */}
          {conversations.length > 2 && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Suhbatlarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#10A37F]/60"
              />
            </div>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* Pinned conversations */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-1 px-3 mb-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <Pin className="h-3 w-3 text-amber-400" />
                <span>Qadalgan suhbatlar</span>
              </div>
              <div className="space-y-1">
                {pinnedConversations.map((conv) => renderItem(conv))}
              </div>
            </div>
          )}

          {/* Regular conversations */}
          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              {pinnedConversations.length > 0 ? 'Boshqa suhbatlar' : 'Suhbatlar tarixi'}
            </div>
            {regularConversations.length === 0 && pinnedConversations.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-neutral-500">
                Hozircha suhbatlar yo'q. Biror narsa yozing!
              </div>
            ) : (
              <div className="space-y-1">
                {regularConversations.map((conv) => renderItem(conv))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer with User profile and Settings */}
        <div className="p-3 border-t border-[#262626] bg-[#141414] space-y-2">
          {conversations.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Tarixni tozalash</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 font-semibold text-xs shrink-0">
                Z
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                  <span>ergashexsss702</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  Pro Foydalanuvchi
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
              title="Sozlamalar"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  function renderItem(conv: Conversation) {
    const isActive = conv.id === activeId;
    const isEditing = editingId === conv.id;

    return (
      <div
        key={conv.id}
        onClick={() => onSelectConversation(conv.id)}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
          isActive
            ? 'bg-[#212121] text-white font-medium shadow-xs border border-[#333333]'
            : 'text-neutral-400 hover:bg-[#1f1f1f] hover:text-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#10A37F]' : 'text-neutral-500'}`} />
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-[#141414] text-xs px-2 py-1 rounded border border-[#10A37F] text-white focus:outline-none"
            />
          ) : (
            <span className="truncate text-xs">{conv.title}</span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={(e) => saveRename(conv.id, e)}
                className="p-1 hover:text-emerald-400 text-neutral-400"
                title="Saqlash"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="p-1 hover:text-red-400 text-neutral-400"
                title="Bekor qilish"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPinConversation(conv.id);
                }}
                className={`p-1 hover:text-amber-400 ${conv.isPinned ? 'text-amber-400 opacity-100' : 'text-neutral-500'}`}
                title={conv.isPinned ? "Qadashdan chiqarish" : "Yuqoriga qadash"}
              >
                <Pin className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => startRename(conv, e)}
                className="p-1 hover:text-neutral-200 text-neutral-500"
                title="Nomini o'zgartirish"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                className="p-1 hover:text-red-400 text-neutral-500"
                title="O'chirish"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
};
