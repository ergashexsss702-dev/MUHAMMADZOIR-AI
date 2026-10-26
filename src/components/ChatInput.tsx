import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Attachment } from '../types';
import { 
  ArrowUp, 
  Square, 
  Paperclip, 
  Globe, 
  Mic, 
  MicOff, 
  X, 
  Image as ImageIcon 
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, images?: Attachment[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  useSearch: boolean;
  onToggleSearch: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStop,
  isStreaming,
  useSearch,
  onToggleSearch,
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  // Speech Recognition setup (STT)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'uz-UZ';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? prev + ' ' : '') + currentTranscript);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Brauzeringiz ovoz bilan kiritishni (Speech-to-Text) to'liq qo'llab-quvvatlamaydi.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert("Faqat rasmlar (JPEG, PNG, WEBP) yuklash mumkin.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const fullDataUrl = event.target?.result as string;
        // strip data:image/...;base64,
        const base64Data = fullDataUrl.split(',')[1];
        const newAttachment: Attachment = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          mimeType: file.type,
          data: base64Data,
          previewUrl: fullDataUrl,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || disabled) return;
    if (isStreaming) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-3">
      {/* Uploaded attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-[#212121] border border-[#333333]">
          {attachments.map((file) => (
            <div key={file.id} className="relative group rounded-lg overflow-hidden border border-[#444444] bg-[#141414]">
              <img src={file.previewUrl} alt={file.name} className="h-16 w-16 object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(file.id)}
                className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 transition-colors cursor-pointer"
                title="O'chirish"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Container */}
      <div className="relative rounded-2xl bg-[#212121] border border-[#333333] focus-within:border-[#10A37F]/70 focus-within:ring-1 focus-within:ring-[#10A37F]/50 shadow-lg transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ZOIR AI ga savol bering yoki vazifa topshiring... (Shift+Enter yangi qator)"
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-12 text-[15px] text-white placeholder-neutral-400 focus:outline-none max-h-48"
        />

        {/* Input Bottom Action Bar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
          {/* Left tools: Attach file, Web search toggle, Mic */}
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2c2c2c] transition-colors cursor-pointer"
              title="Rasm biriktirish"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                useSearch
                  ? 'bg-[#10A37F]/20 text-[#10A37F] border border-[#10A37F]/40'
                  : 'text-neutral-400 hover:text-white hover:bg-[#2c2c2c]'
              }`}
              title="Google qidiruvi orqali ma'lumot izlash"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Qidiruv</span>
            </button>

            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'text-neutral-400 hover:text-white hover:bg-[#2c2c2c]'
              }`}
              title={isListening ? "Ovoz yozishni to'xtatish" : "Ovoz orqali yozish"}
            >
              {isListening ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {/* Right action: Send or Stop */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-white hover:bg-neutral-200 text-black transition-colors cursor-pointer shadow"
                title="Generatsiyani to'xtatish"
              >
                <Square className="h-3.5 w-3.5 fill-black" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() && attachments.length === 0}
                className={`flex items-center justify-center h-8 w-8 rounded-full transition-all cursor-pointer shadow ${
                  input.trim() || attachments.length > 0
                    ? 'bg-[#10A37F] hover:bg-[#0e8e6e] text-white'
                    : 'bg-[#333333] text-neutral-500 cursor-not-allowed'
                }`}
                title="Yuborish"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-[11px] text-neutral-500">
          ZOIR AI xatolarga yo'l qo'yishi mumkin. Muhim fakt va ma'lumotlarni tekshiring.
        </p>
      </div>
    </div>
  );
};
