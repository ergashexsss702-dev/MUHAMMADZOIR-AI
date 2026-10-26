/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserSettings, Attachment } from './types';
import { 
  loadConversations, 
  saveConversations, 
  loadSettings, 
  saveSettings, 
  DEFAULT_SETTINGS 
} from './lib/storage';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { 
  Menu, 
  Sparkles, 
  Share2, 
  ChevronDown, 
  Check, 
  Zap, 
  Globe, 
  Code2, 
  Languages, 
  FileText 
} from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync conversations to localStorage
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Sync settings to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, isStreaming]);

  // Start a new chat
  const handleNewChat = () => {
    setActiveId(null);
    setSidebarOpen(false);
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
  };

  // Toggle Pin
  const handlePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  // Rename
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Clear all
  const handleClearAll = () => {
    setConversations([]);
    setActiveId(null);
  };

  // Stop current streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message
  const handleSendMessage = async (text: string, attachments?: Attachment[]) => {
    if (isStreaming) return;

    let targetConvId = activeId;
    let currentConv = activeConversation;

    // Create a new conversation if none selected
    if (!targetConvId || !currentConv) {
      const newTitle = text.slice(0, 38).trim() || 'Yangi suhbat';
      const newConv: Conversation = {
        id: Math.random().toString(36).substring(2, 10),
        title: newTitle,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      targetConvId = newConv.id;
      currentConv = newConv;
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(newConv.id);
    }

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      images: attachments && attachments.length > 0 ? attachments : undefined,
    };

    const assistantMsgId = Math.random().toString(36).substring(7);
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Update state with user message and placeholder assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === targetConvId) {
          return {
            ...c,
            updatedAt: Date.now(),
            messages: [...c.messages, userMsg, assistantMsg],
          };
        }
        return c;
      })
    );

    setIsStreaming(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Build message history payload for server
      const previousMessages = currentConv.messages;
      const allMessages = [...previousMessages, userMsg];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images?.map((img) => ({
              mimeType: img.mimeType,
              data: img.data,
            })),
          })),
          model: settings.model,
          temperature: settings.temperature,
          systemInstruction: settings.systemInstruction,
          useSearch: settings.useSearch,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server xatoligi (${res.status})`);
      }

      if (!res.body) {
        throw new Error('Javob oqimi mavjud emas');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.replace(/^data:\s*/, '');

          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id === targetConvId) {
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                      ),
                    };
                  }
                  return c;
                })
              );
            }
          } catch (jsonErr: any) {
            // Non-JSON SSE message or malformed chunk
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Generation stopped by user
      } else {
        console.error('Streaming chat failed', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content:
                          err.message ||
                          "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring yoki sozlamalardan boshqa modelni tanlang.",
                        error: true,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeConversation || isStreaming) return;
    const messages = activeConversation.messages;
    if (messages.length === 0) return;

    // Find the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const lastUserMsg = messages[lastUserIndex];
    // Remove all messages after last user message
    const trimmedMessages = messages.slice(0, lastUserIndex);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id ? { ...c, messages: trimmedMessages } : c
      )
    );

    handleSendMessage(lastUserMsg.content, lastUserMsg.images);
  };

  return (
    <div className="flex h-screen w-full bg-[#171717] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onPinConversation={handlePinConversation}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAll}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Main Chat View Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#171717] relative">
        {/* Top Navbar */}
        <header className="h-14 border-b border-[#262626] flex items-center justify-between px-3 md:px-5 shrink-0 bg-[#171717]/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
              title="Menyu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Model Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333333] text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#10A37F]" />
                <span className="font-semibold text-white">
                  {settings.model === 'gemini-2.5-flash'
                    ? 'ZOIR AI (gemini-2.5-flash)'
                    : settings.model === 'gemini-3.8-flash'
                    ? 'ZOIR AI (gemini-3.8-flash)'
                    : 'ZOIR AI (gemini-3.1-flash-lite)'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-[#212121] border border-[#383838] shadow-2xl p-1.5 z-50">
                  {[
                    {
                      id: 'gemini-2.5-flash',
                      title: 'Gemini 2.5 Flash',
                      desc: 'Tezkor va universal aqlli model',
                    },
                    {
                      id: 'gemini-3.8-flash',
                      title: 'Gemini 3.8 Flash',
                      desc: 'Chuqurroq mantiq va dasturlash',
                    },
                    {
                      id: 'gemini-3.1-flash-lite',
                      title: 'Gemini 3.1 Lite',
                      desc: 'O\'ta yengil va lahzalik javob',
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSettings({ ...settings, model: m.id as any });
                        setModelDropdownOpen(false);
                      }}
                      className="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-[#2c2c2c] text-left transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white flex items-center justify-between">
                          <span>{m.title}</span>
                          {settings.model === m.id && (
                            <Check className="h-3.5 w-3.5 text-[#10A37F]" />
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400">{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick search status badge */}
            {settings.useSearch && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10A37F]/10 border border-[#10A37F]/30 text-[#10A37F] text-xs">
                <Globe className="h-3 w-3" />
                <span>Internet qidiruvi faol</span>
              </div>
            )}

            {activeConversation && activeConversation.messages.length > 0 && (
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333333] text-xs text-neutral-200 transition-colors cursor-pointer"
                title="Suhbatni ulashish"
              >
                <Share2 className="h-3.5 w-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Ulashish</span>
              </button>
            )}
          </div>
        </header>

        {/* Message Thread or Empty Hero Screen */}
        <div className="flex-1 overflow-y-auto">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <EmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          ) : (
            <div className="py-4 space-y-2">
              {activeConversation.messages.map((msg, index) => {
                const isLast = index === activeConversation.messages.length - 1;
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isStreaming={isLast && isStreaming && msg.role === 'assistant'}
                    onRegenerate={isLast && msg.role === 'assistant' ? handleRegenerate : undefined}
                    voiceName={settings.voiceName}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Section */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
          useSearch={settings.useSearch}
          onToggleSearch={() =>
            setSettings({ ...settings, useSearch: !settings.useSearch })
          }
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        onClearAllConversations={handleClearAll}
      />

      {/* Share / Export Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        conversation={activeConversation}
      />
    </div>
  );
}
