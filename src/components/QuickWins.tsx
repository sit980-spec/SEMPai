import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Zap, Target, AlertCircle } from 'lucide-react';

export function QuickWins() {
  const { platformData, brand } = useStore();

  const wins = useMemo(() => {
    const results: { type: string, title: string, desc: string, priority: 'high' | 'medium' }[] = [];
    
    Object.values(platformData).forEach(platform => {
      const total = platform.rows.length;
      if (total === 0) return;

      let mentions = 0, citations = 0;
      const compMentions = brand.competitors.map(() => 0);

      platform.rows.forEach(row => {
        if (row.brand_mentioned) mentions++;
        if (row.brand_cited) citations++;
        brand.competitors.forEach((_, i) => {
          if (row[`comp${i+1}_mentioned`]) compMentions[i]++;
        });
      });

      const mRate = mentions / total;
      const cRate = citations / total;
      
      // High citations, zero/low mentions (E-E-A-T issue)
      if (cRate > 0.1 && mRate < 0.05) {
        results.push({
          type: 'eeat',
          title: `Wysokie cytowania, niskie wzmianki na ${platform.name}`,
          desc: `Jesteś cytowany w ${Math.round(cRate*100)}% zapytań, ale wymieniany tylko w ${Math.round(mRate*100)}%. Popraw sygnały marki (E-E-A-T) na cytowanych stronach.`,
          priority: 'high'
        });
      }

      // Competitor domination
      brand.competitors.forEach((comp, i) => {
        const compRate = compMentions[i] / total;
        if (compRate > 0.4 && mRate < 0.1) {
          results.push({
            type: 'comp',
            title: `Dominacja "${comp}" na ${platform.name}`,
            desc: `Konkurent pojawia się w ${Math.round(compRate*100)}% odpowiedzi. Zbadaj jego strukturę treści dla tej platformy.`,
            priority: 'high'
          });
        }
      });

      // Low hanging fruit (good mentions, zero citations)
      if (mRate > 0.2 && cRate < 0.05) {
        results.push({
          type: 'schema',
          title: `Brak cytowań mimo wzmianek na ${platform.name}`,
          desc: `Marka jest rozpoznawana (${Math.round(mRate*100)}%), ale AI nie linkuje do Twojej domeny. Wdróż/popraw Schema.org i linkowanie wewnętrzne.`,
          priority: 'medium'
        });
      }
    });

    return results;
  }, [platformData, brand]);

  if (wins.length === 0) {
    return <div className="text-[#4a7090] text-sm p-4 text-center">Brak oczywistych Quick Wins. Wyniki są zbalansowane.</div>;
  }

  return (
    <div className="space-y-3">
      {wins.map((win, i) => (
        <div key={i} className={`p-4 rounded-lg border ${win.priority === 'high' ? 'bg-[#ff5c6a]/10 border-[#ff5c6a]/30' : 'bg-[#f5c842]/10 border-[#f5c842]/30'}`}>
          <div className="flex items-start gap-3">
            {win.priority === 'high' ? <AlertCircle className="text-[#ff5c6a] shrink-0 mt-0.5" size={16} /> : <Target className="text-[#f5c842] shrink-0 mt-0.5" size={16} />}
            <div>
              <h4 className={`text-sm font-bold mb-1 ${win.priority === 'high' ? 'text-[#ff5c6a]' : 'text-[#f5c842]'}`}>{win.title}</h4>
              <p className="text-xs text-[#e8f0ff]">{win.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
