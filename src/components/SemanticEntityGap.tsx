import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BrainCircuit } from 'lucide-react';

const STOP_WORDS = new Set([
  "w", "z", "do", "na", "o", "i", "a", "jak", "co", "gdzie", "kiedy", "dlaczego", "czy", 
  "najlepsze", "najlepszy", "najlepsza", "tanie", "tani", "tania", "ranking", "opinie", 
  "cena", "sklep", "kupic", "kupić", "dla", "od", "po", "za", "jest", "to", "nie", "tak", 
  "że", "ze", "te", "ten", "ta", "oraz", "lub", "ani", "ale", "tylko", "aby", "bez", "przez",
  "przy", "pod", "nad", "przed", "poza", "jaki", "jaka", "jakie", "ile", "kto"
]);

export function SemanticEntityGap() {
  const { platformData, brand } = useStore();

  const gapAnalysis = useMemo(() => {
    const gapQueries = new Set<string>();
    const queryToCompetitors: Record<string, Set<string>> = {};
    
    // 1. Collect unique queries where brand is missing (no mentions, no citations)
    Object.values(platformData).forEach(platform => {
      platform.rows.forEach(row => {
        if (!row.brand_mentioned && !row.brand_cited && row.query) {
          const q = row.query.toLowerCase().trim();
          gapQueries.add(q);
          
          if (!queryToCompetitors[q]) queryToCompetitors[q] = new Set();
          brand.competitors.forEach((comp, i) => {
            if (row[`comp${i+1}_mentioned`] || row[`comp${i+1}_cited`]) {
              queryToCompetitors[q].add(comp);
            }
          });
        }
      });
    });

    const N = gapQueries.size;
    if (N === 0) return [];

    // 2. Tokenize and calculate DF (Document Frequency) and TF (Term Frequency)
    const df: Record<string, number> = {};
    const tf: Record<string, number> = {};
    const queryTokens: { query: string, tokens: string[] }[] = [];

    Array.from(gapQueries).forEach(query => {
      // Tokenize: split by non-alphanumeric (including Polish chars)
      const words = query.split(/[^a-ząćęłńóśźż]+/g).filter(w => w.length > 2 && !STOP_WORDS.has(w));
      const uniqueWords = new Set(words);
      
      words.forEach(w => {
        tf[w] = (tf[w] || 0) + 1;
      });
      
      uniqueWords.forEach(w => {
        df[w] = (df[w] || 0) + 1;
      });

      queryTokens.push({ query, tokens: words });
    });

    // 3. Calculate TF-IDF and get top entities
    const scores: { word: string, score: number, count: number }[] = [];
    Object.keys(tf).forEach(word => {
      // IDF = log(N / (1 + DF))
      const idf = Math.log(N / (1 + df[word]));
      const score = tf[word] * idf;
      scores.push({ word, score, count: tf[word] });
    });

    // Sort by highest TF-IDF score
    scores.sort((a, b) => b.score - a.score);
    const topEntities = scores.slice(0, 8); // Top 8 missing entities

    // 4. Group queries by top entities and aggregate competitors
    return topEntities.map(entity => {
      const relatedQueries = queryTokens
        .filter(qt => qt.tokens.includes(entity.word))
        .map(qt => qt.query);
        
      const topQueries = relatedQueries.slice(0, 4); // max 4 examples per entity
      
      const compCounts: Record<string, number> = {};
      relatedQueries.forEach(q => {
        const comps = queryToCompetitors[q];
        if (comps) {
          comps.forEach(c => {
            compCounts[c] = (compCounts[c] || 0) + 1;
          });
        }
      });
      
      const dominatingCompetitors = Object.entries(compCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(e => e[0]);
        
      return { ...entity, relatedQueries: topQueries, dominatingCompetitors };
    });

  }, [platformData, brand.competitors]);

  if (gapAnalysis.length === 0) {
    return (
      <div className="text-center p-6 text-[#4a7090]">
        Brak danych do analizy luki semantycznej lub marka jest widoczna we wszystkich zapytaniach.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-lg p-4 flex gap-3 text-[#a78bfa] text-sm">
        <BrainCircuit className="shrink-0 mt-0.5" size={18} />
        <p><strong>Semantic Entity Gap:</strong> Zidentyfikowano klastry tematyczne (analiza TF-IDF), w których Twoja marka nie posiada żadnej widoczności w wynikach AI. Są to potencjalne luki w treściach, które należy uzupełnić.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gapAnalysis.map((entity, i) => (
          <div key={i} className="bg-[#112240] border border-[#1a3354] rounded-lg p-4 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-[#a78bfa] font-bold text-lg capitalize">{entity.word}</h4>
              <span className="text-xs bg-[#0c1a2e] text-[#4a7090] px-2 py-1 rounded border border-[#1a3354]">
                Wystąpienia: {entity.count}
              </span>
            </div>
            <div className="space-y-2 flex-1">
              <div className="text-xs font-bold text-[#4a7090] uppercase tracking-wider">Przykładowe zapytania:</div>
              <ul className="space-y-1">
                {entity.relatedQueries.map((q, j) => (
                  <li key={j} className="text-xs text-[#e8f0ff] flex items-start gap-2">
                    <span className="text-[#a78bfa] mt-0.5">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {entity.dominatingCompetitors.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#1a3354]">
                <div className="text-[10px] font-bold text-[#4a7090] uppercase tracking-wider mb-2">Dominująca konkurencja:</div>
                <div className="flex flex-wrap gap-1.5">
                  {entity.dominatingCompetitors.map((comp, j) => (
                    <span key={j} className="text-xs text-[#f5c842] bg-[#f5c842]/10 px-2 py-1 rounded border border-[#f5c842]/30">
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
