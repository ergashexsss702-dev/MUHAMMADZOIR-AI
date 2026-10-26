import React from 'react';
import { 
  Code2, 
  Languages, 
  PenTool, 
  BrainCircuit, 
  Lightbulb, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => {
  const samplePrompts = [
    {
      category: 'Dasturlash',
      icon: Code2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'React & Tailwind komponenti',
      prompt: "React va Tailwind CSS yordamida zamonaviy, animatsiyali foydalanuvchi profil kartasi komponentini yozib ber.",
    },
    {
      category: 'Tarjima & Til',
      icon: Languages,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      title: 'Ravon o\'zbekcha tarjima',
      prompt: "Ushbu xabarni ingliz tilidan o'zbek adabiy tiliga barcha nozik ma'nolari bilan professional darajada tarjima qil: 'Artificial intelligence is fundamentally reshaping how developers build software.'",
    },
    {
      category: 'Matn yaratish',
      icon: PenTool,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      title: 'Jalb qiluvchi post yoki maqola',
      prompt: "IT sohasi yoki yangi startap loyihasi haqida ijtimoiy tarmoqlar uchun e'tiborni tortuvchi va foydali post yozib ber.",
    },
    {
      category: 'Tahlil & Xulosa',
      icon: BrainCircuit,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      title: 'Murakkab mavzuni xulosalash',
      prompt: "Katta til modellari (LLM) va generativ sun'iy intellektning ishlash prinsipini 5 ta asosiy bandda sodda tushuntir.",
    },
    {
      category: 'Kreativ g\'oyalar',
      icon: Lightbulb,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      title: 'Startap va biznes takliflar',
      prompt: "O'zbekistonda sun'iy intellekt texnologiyalaridan foydalangan holda amalga oshirish mumkin bo'lgan 4 ta innovatsion biznes g'oya ber.",
    },
    {
      category: 'Ta\'lim & Maslahat',
      icon: BookOpen,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10 border-teal-500/20',
      title: 'O\'rganish rejasi',
      prompt: "Zamonaviy Full-stack dasturchi (React + Node.js) bo'lish uchun 3 oylik bosqichma-bosqich o'rganish rejasi tuzib ber.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 max-w-4xl mx-auto text-center">
      {/* Sleek Logo & Badge */}
      <div className="relative mb-6">
        <div className="absolute -inset-2 bg-gradient-to-r from-[#10A37F] to-[#20d19e] rounded-3xl blur-xl opacity-30 animate-pulse" />
        <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-tr from-[#10A37F] to-[#2bd9a4] flex items-center justify-center text-white shadow-2xl ring-4 ring-[#10A37F]/20">
          <Sparkles className="h-9 w-9 md:h-11 md:w-11" />
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
        ZOIR AI
      </h1>
      <p className="text-neutral-400 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
        ChatGPT uslubidagi aqlli, tezkor va xushmuomala AI yordamchi.
        Bugun sizga qanday yordam bera olaman?
      </p>

      {/* Grid of sample prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full text-left">
        {samplePrompts.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-xl bg-[#212121]/70 hover:bg-[#282828] border border-[#333333] hover:border-[#10A37F]/50 transition-all text-left flex flex-col justify-between cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1.5 rounded-lg border ${item.bgColor}`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </span>
                  <span className="text-xs font-semibold text-neutral-400 group-hover:text-emerald-400 transition-colors">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-neutral-200 group-hover:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
