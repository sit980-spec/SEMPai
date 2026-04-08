import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { FileWarning, Link, Search } from 'lucide-react';

export function CitationMentionRatio() {
  const { platformData } = useStore();

  const ratios = useMemo(() => {
    const results: { platform: string, ratio: number, mentions: number, citations: number }[] = [];
    
    Object.values(platformData).forEach(platform => {
      let mentions = 0;
      let citations = 0;
      
      platform.rows.forEach(row => {
        if (row.brand_mentioned) mentions++;
        if (row.brand_cited) citations++;
      });

      if (mentions > 0 || citations > 0) {
        // Handle division by zero if mentions is 0 but citations > 0
        const ratio = mentions === 0 ? citations : citations / mentions;
        results.push({ platform: platform.name, ratio, mentions, citations });
      }
    });

    return results;
  }, [platformData]);

  if (ratios.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white">Citation-to-Mention Ratio</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ratios.map((r, i) => {
          const isLow = r.ratio < 1.0;
          const isHigh = r.ratio > 1.0;
          
          return (
            <div key={i} className="bg-[#112240] border border-[#1a3354] rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[#e8f0ff]">{r.platform}</span>
                <span className={`font-mono font-bold ${isLow ? 'text-[#ff5c6a]' : isHigh ? 'text-[#f5c842]' : 'text-[#2edf8f]'}`}>
                  {r.ratio.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-[#4a7090] mb-3">
                Wzmianki: {r.mentions} | Cytowania: {r.citations}
              </div>
              
              {isLow && (
                <div className="bg-[#ff5c6a]/10 border border-[#ff5c6a]/30 rounded p-2 flex items-start gap-2 text-xs text-[#ff5c6a]">
                  <Search size={14} className="shrink-0 mt-0.5" />
                  <p><strong>Zalecenie:</strong> Wynik &lt; 1.0. Marka jest wymieniana, ale rzadko linkowana. Przeprowadź audyt E-E-A-T i popraw sygnały autorytetu marki.</p>
                </div>
              )}
              
              {isHigh && (
                <div className="bg-[#f5c842]/10 border border-[#f5c842]/30 rounded p-2 flex items-start gap-2 text-xs text-[#f5c842]">
                  <Link size={14} className="shrink-0 mt-0.5" />
                  <p><strong>Zalecenie:</strong> Wynik &gt; 1.0. Jesteś linkowany częściej niż wymieniany z nazwy. Wdróż/zoptymalizuj Schema.org, aby modele lepiej rozumiały kontekst linków.</p>
                </div>
              )}

              {r.ratio === 1.0 && (
                <div className="bg-[#2edf8f]/10 border border-[#2edf8f]/30 rounded p-2 flex items-start gap-2 text-xs text-[#2edf8f]">
                  <FileWarning size={14} className="shrink-0 mt-0.5" />
                  <p><strong>Zalecenie:</strong> Wynik zbalansowany. Utrzymuj obecną strategię treści.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
