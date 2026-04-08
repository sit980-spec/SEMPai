import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle } from 'lucide-react';

export function CannibalizationChecker() {
  const { platformData, brand } = useStore();

  const cannibalizationIssues = useMemo(() => {
    const urlToQueries: Record<string, Set<string>> = {};
    const urlToCompetitors: Record<string, Set<string>> = {};
    
    Object.values(platformData).forEach(platform => {
      platform.rows.forEach(row => {
        if (row.brand_cited && row.url) {
          const url = row.url.trim();
          if (!urlToQueries[url]) {
            urlToQueries[url] = new Set();
            urlToCompetitors[url] = new Set();
          }
          urlToQueries[url].add(row.query);
          
          // Check if competitors are also mentioned/cited for these queries
          brand.competitors.forEach((comp, i) => {
            if (row[`comp${i+1}_mentioned`] || row[`comp${i+1}_cited`]) {
              urlToCompetitors[url].add(comp);
            }
          });
        }
      });
    });

    return Object.entries(urlToQueries)
      .filter(([_, queries]) => queries.size > 1)
      .map(([url, queries]) => ({ 
        url, 
        queries: Array.from(queries),
        competitors: Array.from(urlToCompetitors[url] || [])
      }))
      .sort((a, b) => b.queries.length - a.queries.length);
  }, [platformData, brand.competitors]);

  if (cannibalizationIssues.length === 0) {
    return (
      <div className="text-center p-6 text-[#4a7090]">
        Brak wykrytej kanibalizacji. Każdy adres URL odpowiada na unikalne zapytania.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#ff5c6a]/10 border border-[#ff5c6a]/30 rounded-lg p-4 flex gap-3 text-[#ff5c6a] text-sm">
        <AlertTriangle className="shrink-0" size={18} />
        <p>Wykryto potencjalną kanibalizację. Modele AI cytują ten sam URL dla różnych intencji zapytań, co może osłabiać autorytet tematyczny.</p>
      </div>
      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {cannibalizationIssues.map((issue, i) => (
          <div key={i} className="bg-[#0c1a2e] border border-[#1a3354] rounded-lg p-4">
            <div className="text-[#4da6ff] text-xs font-mono mb-2 truncate" title={issue.url}>
              {issue.url}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {issue.queries.map((q, j) => (
                <span key={j} className="bg-[#112240] text-[#e8f0ff] text-[10px] px-2 py-1 rounded border border-[#1a3354]">
                  {q}
                </span>
              ))}
            </div>
            {issue.competitors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#1a3354]">
                <span className="text-[10px] text-[#4a7090] uppercase mr-2">Konkurencja w tym obszarze:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {issue.competitors.map((comp, j) => (
                    <span key={j} className="text-[10px] text-[#f5c842] bg-[#f5c842]/10 px-1.5 py-0.5 rounded border border-[#f5c842]/30">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
