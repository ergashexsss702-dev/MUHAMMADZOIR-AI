import React from 'react';
import { UserSettings } from '../types';
import { 
  X, 
  Cpu, 
  Sliders, 
  Terminal, 
  Volume2, 
  Download, 
  Trash2, 
  Check, 
  Sparkles,
  Info 
} from 'lucide-react';
import { exportAllData } from '../lib/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onClearAllConversations: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllConversations,
}) => {
  if (!isOpen) return null;

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportAllData());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zoir_ai_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#10A37F]/10 text-[#10A37F]">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">ZOIR AI Sozlamalari</h2>
              <p className="text-xs text-neutral-400">Model va yordamchi parametrlarini sozlash</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2c2c2c] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          {/* AI Model Selector */}
          <div>
            <label className="flex items-center gap-2 font-medium text-white mb-2">
              <Cpu className="h-4 w-4 text-[#10A37F]" />
              <span>AI Modeli</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'gemini-2.5-flash',
                  name: 'Gemini 2.5 Flash',
                  badge: 'Tavsiya',
                  desc: 'Eng tezkor va aqlli',
                },
                {
                  id: 'gemini-3.8-flash',
                  name: 'Gemini 3.8 Flash',
                  badge: 'Flagman',
                  desc: 'Keng bilim va tahlil',
                },
                {
                  id: 'gemini-3.1-flash-lite',
                  name: 'Gemini 3.1 Lite',
                  badge: 'Yengil',
                  desc: 'Maksimal tezlik',
                },
              ].map((m) => {
                const isSelected = settings.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      onSaveSettings({ ...settings, model: m.id as any })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#10A37F] bg-[#10A37F]/10 text-white shadow-xs'
                        : 'border-[#333333] bg-[#242424] text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs">{m.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected
                            ? 'bg-[#10A37F] text-black font-bold'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#10A37F]" />
                <span>Kreativlik darajasi (Harorat): {settings.temperature}</span>
              </label>
              <span className="text-xs text-neutral-400">
                {settings.temperature < 0.4
                  ? 'Aniq va qat\'iy'
                  : settings.temperature > 0.8
                  ? 'Kreativ va erkin'
                  : 'Muvozanatli'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                onSaveSettings({
                  ...settings,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[#10A37F] bg-neutral-700 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
              <span>0.0 (Dasturlash va aniq faktlar)</span>
              <span>1.0 (Ijodiy yozish)</span>
            </div>
          </div>

          {/* System Instruction */}
          <div>
            <label className="flex items-center gap-2 font-medium text-white mb-2">
              <Terminal className="h-4 w-4 text-[#10A37F]" />
              <span>Tizim ko'rsatmasi (System Prompt)</span>
            </label>
            <textarea
              rows={4}
              value={settings.systemInstruction}
              onChange={(e) =>
                onSaveSettings({ ...settings, systemInstruction: e.target.value })
              }
              className="w-full p-3 rounded-xl bg-[#141414] border border-[#333333] text-xs text-neutral-200 focus:outline-none focus:border-[#10A37F] leading-relaxed resize-none"
              placeholder="ZOIR AI o'zini qanday tutishi kerakligini belgilang..."
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Bu ko'rsatma har bir so'rovga qo'shiladi va ZOIR AI xatti-harakatini boshqaradi.
            </p>
          </div>

          {/* Voice Output Settings */}
          <div>
            <label className="flex items-center gap-2 font-medium text-white mb-2">
              <Volume2 className="h-4 w-4 text-[#10A37F]" />
              <span>Ovozli eshittirish ovozi (TTS Voice)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as const).map(
                (v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSaveSettings({ ...settings, voiceName: v })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      settings.voiceName === v
                        ? 'border-[#10A37F] bg-[#10A37F]/10 text-white'
                        : 'border-[#333333] bg-[#242424] text-neutral-400 hover:text-white'
                    }`}
                  >
                    {v}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Data and Backup */}
          <div className="pt-2 border-t border-[#2e2e2e]">
            <label className="font-medium text-white block mb-3">
              Ma'lumotlar va Tarix
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] border border-[#383838] text-xs text-neutral-200 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#10A37F]" />
                <span>Suhbatlarni yuklab olish (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Haqiqatan ham barcha suhbatlar tarixini tozalashni xohlaysizmi?")) {
                    onClearAllConversations();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-xs text-red-300 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                <span>Barcha ma'lumotlarni o'chirish</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-[#2e2e2e] bg-[#191919]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#10A37F] hover:bg-[#0e8e6e] text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            Tayyor
          </button>
        </div>
      </div>
    </div>
  );
};
