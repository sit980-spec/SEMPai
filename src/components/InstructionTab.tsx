import React from 'react';
import { BookOpen, CheckCircle, Target, Zap, TrendingUp, AlertCircle, Layers } from 'lucide-react';

export function InstructionTab({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-3xl font-black text-white tracking-tight">Sempai AI Visibility Generator</h2>
        <p className="text-[#4a7090] max-w-2xl mx-auto">
          Zautomatyzowane narzędzie do analizy widoczności marek w wynikach generatywnych AI. 
          Przekształć surowe eksporty z Ahrefs w gotowe, interaktywne raporty dla klientów.
        </p>
      </div>

      {/* 5-Step Guide */}
      <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-8 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <CheckCircle className="text-[#2edf8f]" /> Przewodnik: Eksport z Ahrefs w 5 krokach
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: 1, title: 'Wybierz AI Responses', desc: 'W Ahrefs przejdź do raportu słów kluczowych i włącz filtr "AI Responses".' },
            { step: 2, title: 'Filtruj platformę', desc: 'Wybierz konkretną platformę AI (np. ChatGPT, Gemini) z listy rozwijanej.' },
            { step: 3, title: 'Eksportuj wszystko', desc: 'Użyj dolnego przycisku "Export", aby pobrać wszystkie wyniki (nie tylko widoczne).' },
            { step: 4, title: 'Wybierz UTF-8/16', desc: 'Zapisz plik w formacie CSV z kodowaniem UTF-8 lub UTF-16.' },
            { step: 5, title: 'Wgraj do aplikacji', desc: 'Przejdź do zakładki "Import Danych" i upuść pliki w odpowiednie strefy.' }
          ].map((s) => (
            <div key={s.step} className="bg-[#112240] border border-[#1a3354] rounded-xl p-4 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-6xl font-black text-[#1a3358] opacity-50">{s.step}</div>
              <div className="relative z-10">
                <h4 className="font-bold text-[#e8f0ff] mb-2 text-sm">{s.title}</h4>
                <p className="text-xs text-[#4a7090]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Glossary */}
      <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-8 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="text-[#4da6ff]" /> Słowniczek Wskaźników
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-5 border-t-2 border-t-[#2edf8f]">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-[#2edf8f]" />
              <h4 className="font-bold text-white text-sm">AI Share of Voice (SOV)</h4>
            </div>
            <p className="text-xs text-[#4a7090]">Udział marki w rynku wyliczony jako stosunek wzmianek o Twojej marce do sumy wzmianek Twoich i top 5 konkurentów.</p>
          </div>
          <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-5 border-t-2 border-t-[#4da6ff]">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={16} className="text-[#4da6ff]" />
              <h4 className="font-bold text-white text-sm">Presence Score</h4>
            </div>
            <p className="text-xs text-[#4a7090]">Ogólny wskaźnik obecności. Uwzględnia zarówno wzmianki (waga 1.0) jak i cytowania (waga 0.5) w stosunku do wszystkich zapytań.</p>
          </div>
          <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-5 border-t-2 border-t-[#a78bfa]">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-[#a78bfa]" />
              <h4 className="font-bold text-white text-sm">Mention vs Citation Rate</h4>
            </div>
            <p className="text-xs text-[#4a7090]">Mention Rate to % zapytań, gdzie marka jest wymieniona w tekście. Citation Rate to % zapytań, gdzie AI linkuje do Twojej domeny.</p>
          </div>
          <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-5 border-t-2 border-t-[#f5c842]">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-[#f5c842]" />
              <h4 className="font-bold text-white text-sm">Quick Wins</h4>
            </div>
            <p className="text-xs text-[#4a7090]">Automatyczne rekomendacje. Np. jeśli masz wysokie cytowania, ale niskie wzmianki, system zasugeruje poprawę sygnałów E-E-A-T.</p>
          </div>
          <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-5 border-t-2 border-t-[#ff5c6a]">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={16} className="text-[#ff5c6a]" />
              <h4 className="font-bold text-white text-sm">Brand Variants</h4>
            </div>
            <p className="text-xs text-[#4a7090]">Warianty nazwy marki (np. "Sempai", "sempai.pl"). System używa ich do wykrywania wzmianek w surowych tekstach odpowiedzi AI.</p>
          </div>
          <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-5 border-t-2 border-t-[#20b571]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-[#20b571]" />
              <h4 className="font-bold text-white text-sm">Predictive Brand Lift</h4>
            </div>
            <p className="text-xs text-[#4a7090]">Prognoza wzrostu ruchu z wyszukiwarek na podstawie obecnego SOV w AI i historycznego wzrostu wyszukiwań brandowych.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <button 
          onClick={onStart}
          className="bg-[#2edf8f] text-[#07111f] px-10 py-4 rounded-xl text-lg font-black hover:bg-[#20b571] transition-all shadow-[0_0_30px_rgba(46,223,143,0.3)] hover:shadow-[0_0_40px_rgba(46,223,143,0.5)] transform hover:-translate-y-1"
        >
          Zaczynamy
        </button>
      </div>

    </div>
  );
}
