import React, { useState } from 'react';
import { Language } from '../../data/villageData';
import { TRANSLATIONS } from '../../data/translations';
import { X, Sparkles, Send, Loader2, MessageSquare, Bot } from 'lucide-react';

interface VillageAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeVillageName?: string;
}

export const VillageAssistantModal: React.FC<VillageAssistantModalProps> = ({
  isOpen,
  onClose,
  lang,
  activeVillageName
}) => {
  const t = TRANSLATIONS[lang];
  const vName = activeVillageName || (lang === 'ar' ? 'قرية ىقباس' : 'Noqbas Village');
  const [question, setQuestion] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: lang === 'ar'
        ? `أهلاً بيك يا جاري العزيز في ${vName}! أنا عماد، مساعدك هنا عشان أوصلك لأي خدمة في البلد. اسألني عن الدكاترة، الصنايعية، خريطة الأماكن، الفطير والأكل البيتي، أو توصيل الصيدلية.`
        : `Welcome, neighbor to ${vName}! I am Emad, your community helper. Ask me about doctors, technicians, map locations, bakeries, or distance-based pharmacy delivery.`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = lang === 'ar' ? [
    'مين أشطر كهربائي يصلح قفلة في البيت دلوقتي؟',
    'الميه بتيجي امتى في الناحية الشرقية؟',
    'عايز أطلب فطير مشلتت أو أكل بيتي بالتوصيل',
    'محتاج دواء ضغط من الصيدلية للبيت'
  ] : [
    'Who is the best electrician for home power repairs?',
    'When is drinking water pumped this week?',
    'How do I order fresh feteer and homemade food?',
    'I need blood pressure medicine from the pharmacy'
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    setChatLog((prev) => [...prev, { sender: 'user', text: q }]);
    setQuestion('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/village-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, language: lang, villageName: vName })
      });

      if (!res.ok) throw new Error('Assistant API error');
      const data = await res.json();
      setChatLog((prev) => [...prev, { sender: 'assistant', text: data.answer }]);
    } catch (e) {
      console.error(e);
      const fallback = lang === 'ar'
        ? 'أهلاً بيك! تقدر تفتح قسم الصنايعية وتكلم الأسطى أبو أحمد الكهربائي (01045678901)، أو قسم الدكاترة تحجز مع د. طارق (100 ج.م)، أو تطلب فطير سخن من فرن البركة!'
        : 'Hello! You can check the Technicians tab to call Abu Ahmad the Electrician (01045678901), visit the Doctors tab for Dr. Tariq (100 EGP), or order fresh feteer from Al-Baraka Bakery!';
      setChatLog((prev) => [...prev, { sender: 'assistant', text: fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-100">
                {lang === 'ar' ? 'عماد - دليل وخدمة القرية' : 'Emad - Village Guide'}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {lang === 'ar' ? 'بيجاوبك بالمصري البسيط ويدلك على أقرب خدمة في بلدك' : 'Friendly local guidance for every service in your village'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 text-xs">
          {chatLog.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>{t.aiThinking}</span>
            </div>
          )}
        </div>

        {/* Quick Questions Chips */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {quickQuestions.map((qq, i) => (
            <button
              key={i}
              onClick={() => handleAsk(qq)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {qq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shrink-0"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.aiPlaceholder}
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
