import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';

export function IntentMatrix() {
  const { platformData, brand } = useStore();
  
  const matrix = useMemo(() => {
    const intents = ['Informacyjne', 'Komercyjne', 'Transakcyjne'];
    const entities = [brand.name || 'Twoja Marka', ...brand.competitors];
    
    // Initialize matrix
    const data: Record<string, Record<string, { mentions: number, total: number }>> = {};
    intents.forEach(i => {
      data[i] = {};
      entities.forEach(e => {
        data[i][e] = { mentions: 0, total: 0 };
      });
    });

    // Aggregate data
    Object.values(platformData).forEach(platform => {
      platform.rows.forEach(row => {
        const intent = row.intent || 'Informacyjne';
        if (!data[intent]) return; // Skip unknown intents
        
        entities.forEach((entity, idx) => {
          data[intent][entity].total++;
          if (idx === 0) {
            if (row.brand_mentioned) data[intent][entity].mentions++;
          } else {
            if (row[`comp${idx}_mentioned`]) data[intent][entity].mentions++;
          }
        });
      });
    });

    return { intents, entities, data };
  }, [platformData, brand]);

  const getColor = (mentions: number, total: number) => {
    if (total === 0) return 'bg-[#112240] text-[#4a7090]';
    const ratio = mentions / total;
    if (ratio > 0.5) return 'bg-[#2edf8f]/20 text-[#2edf8f] border-[#2edf8f]/50';
    if (ratio > 0.2) return 'bg-[#f5c842]/20 text-[#f5c842] border-[#f5c842]/50';
    return 'bg-[#ff5c6a]/20 text-[#ff5c6a] border-[#ff5c6a]/50';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-[#4a7090] uppercase bg-[#0c1a2e] border-b border-[#1a3354]">
          <tr>
            <th className="px-4 py-3">Intencja</th>
            {matrix.entities.map(e => (
              <th key={e} className="px-4 py-3 text-right">{e}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.intents.map(intent => (
            <tr key={intent} className="border-b border-[#1a3354] bg-[#07111f]">
              <td className="px-4 py-3 font-medium text-white">{intent}</td>
              {matrix.entities.map(entity => {
                const cell = matrix.data[intent][entity];
                const pct = cell.total > 0 ? Math.round((cell.mentions / cell.total) * 100) : 0;
                return (
                  <td key={entity} className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-1 rounded border ${getColor(cell.mentions, cell.total)}`}>
                      {pct}% <span className="text-[10px] opacity-70">({cell.mentions})</span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
