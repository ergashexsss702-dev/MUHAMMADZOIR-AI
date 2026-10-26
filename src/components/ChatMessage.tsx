import React, { useState, useRef } from 'react';
import { Message } from '../types';
import { MarkdownView } from './MarkdownView';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  voiceName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  voiceName = 'Kore',
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayTTS = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    // Clean markdown syntax for cleaner TTS
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'Kod bloki.')
      .replace(/[#*`_~]/g, '')
      .slice(0, 800);

    try {
      setIsLoadingAudio(true);
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: voiceName }),
      });

      if (!res.ok) throw new Error("Audio yuklanmadi");
      const data = await res.json();

      if (data.audio) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audio}`);
        audioRef.current = audio;

        audio.onplay = () => setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => {
          setIsPlayingAudio(false);
          setIsLoadingAudio(false);
        };

        await audio.play();
      }
    } catch (err) {
      console.error('Audio play error:', err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-4 px-4">
        <div className="max-w-[85%] md:max-w-[70%] flex flex-col items-end">
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {message.images.map((img) => (
                <div key={img.id} className="relative rounded-lg overflow-hidden border border-[#333333] shadow-md max-w-[200px]">
                  <img src={img.previewUrl} alt={img.name} className="object-cover max-h-40 w-auto rounded-lg" />
                </div>
              ))}
            </div>
          )}
          <div className="rounded-2xl rounded-tr-sm bg-[#2f2f2f] text-white px-4 py-3 shadow-sm text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3.5 my-4 px-4 md:px-6 max-w-4xl mx-auto w-full transition-colors">
      {/* Bot Avatar */}
      <div className="shrink-0 mt-0.5">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#10A37F] to-[#26d09e] flex items-center justify-center text-white shadow-md shadow-[#10A37F]/20 ring-2 ring-[#10A37F]/30">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      {/* Bot Response Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-neutral-200">ZOIR AI</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#242424] text-emerald-400 border border-[#333333]">
            gemini-2.5-flash
          </span>
        </div>

        {message.error ? (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1">{message.content}</div>
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-900/60 hover:bg-red-800 text-xs text-white transition-colors cursor-pointer"
              >
                <RotateCw className="h-3 w-3" /> Qayta urinish
              </button>
            )}
          </div>
        ) : (
          <div className="text-neutral-100 text-[15px] leading-relaxed">
            <MarkdownView content={message.content} />
            {isStreaming && <span className="cursor-blink" />}
          </div>
        )}

        {/* Message Actions */}
        {!isStreaming && !message.error && (
          <div className="flex items-center gap-1 mt-2.5 pt-1 text-neutral-400 text-xs opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
              title="Nusxa olish"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Nusxalandi</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Nusxalash</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePlayTTS}
              disabled={isLoadingAudio}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
              title="Ovozli eshitish"
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>Yuklanmoqda...</span>
                </>
              ) : isPlayingAudio ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">To'xtatish</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Ovozli eshitish</span>
                </>
              )}
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#262626] hover:text-white transition-colors cursor-pointer"
                title="Javobni qayta shakllantirish"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Qayta yozish</span>
              </button>
            )}

            <div className="h-3 w-px bg-[#333333] mx-1" />

            <button
              type="button"
              onClick={() => setFeedback(feedback === 'liked' ? null : 'liked')}
              className={`p-1.5 rounded-md hover:bg-[#262626] transition-colors cursor-pointer ${
                feedback === 'liked' ? 'text-emerald-400 bg-[#242424]' : 'hover:text-white'
              }`}
              title="Foydali javob"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setFeedback(feedback === 'disliked' ? null : 'disliked')}
              className={`p-1.5 rounded-md hover:bg-[#262626] transition-colors cursor-pointer ${
                feedback === 'disliked' ? 'text-red-400 bg-[#242424]' : 'hover:text-white'
              }`}
              title="Foydali emas"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
