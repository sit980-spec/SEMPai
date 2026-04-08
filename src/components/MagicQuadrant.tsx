import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

export function MagicQuadrant() {
  const { platformData, brand } = useStore();

  const data = useMemo(() => {
    let brandMentions = 0;
    let brandCitations = 0;
    let totalQueries = 0;
    
    const compStats: Record<string, { mentions: number, citations: number }> = {};
    brand.competitors.forEach(c => {
      if (c.trim()) {
        compStats[c.trim()] = { mentions: 0, citations: 0 };
      }
    });

    Object.values(platformData).forEach(platform => {
      totalQueries += platform.rows.length;
      platform.rows.forEach(row => {
        if (row.brand_mentioned) brandMentions++;
        if (row.brand_cited) brandCitations++;

        brand.competitors.forEach((c, i) => {
          const compName = c.trim();
          if (!compName) return;
          if (row[`comp${i+1}_mentioned`]) compStats[compName].mentions++;
          if (row[`comp${i+1}_cited`]) compStats[compName].citations++;
        });
      });
    });

    if (totalQueries === 0) return [];

    const chartData = [
      { 
        name: brand.name || 'Twoja Marka', 
        x: Number(((brandCitations / totalQueries) * 100).toFixed(1)), 
        y: Number(((brandMentions / totalQueries) * 100).toFixed(1)), 
        isBrand: true 
      }
    ];

    Object.entries(compStats).forEach(([name, stats]) => {
      chartData.push({ 
        name, 
        x: Number(((stats.citations / totalQueries) * 100).toFixed(1)), 
        y: Number(((stats.mentions / totalQueries) * 100).toFixed(1)), 
        isBrand: false 
      });
    });

    return chartData;
  }, [platformData, brand]);

  if (data.length <= 1 && data[0]?.x === 0 && data[0]?.y === 0) {
    return null;
  }

  // Calculate medians for quadrant lines
  const xValues = data.map(d => d.x).sort((a, b) => a - b);
  const yValues = data.map(d => d.y).sort((a, b) => a - b);
  const xMedian = xValues[Math.floor(xValues.length / 2)] || 1;
  const yMedian = yValues[Math.floor(yValues.length / 2)] || 1;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#112240] border border-[#1a3354] p-3 rounded-lg shadow-xl">
          <p className={`font-bold ${data.isBrand ? 'text-[#2edf8f]' : 'text-[#ff5c6a]'}`}>{data.name}</p>
          <p className="text-sm text-[#e8f0ff]">Wzmianki (Świadomość): {data.y}%</p>
          <p className="text-sm text-[#e8f0ff]">Cytowania (Autorytet): {data.x}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 relative">
      <div className="absolute top-2 right-4 text-xs font-bold text-[#4a7090]/50 uppercase">Liderzy</div>
      <div className="absolute top-2 left-4 text-xs font-bold text-[#4a7090]/50 uppercase">Niszowi</div>
      <div className="absolute bottom-6 right-4 text-xs font-bold text-[#4a7090]/50 uppercase">Niewykorzystany Potencjał</div>
      <div className="absolute bottom-6 left-4 text-xs font-bold text-[#4a7090]/50 uppercase">Zagrożeni</div>
      
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a3354" />
          <XAxis type="number" dataKey="x" name="Cytowania" stroke="#4a7090" tick={{ fill: '#4a7090' }} label={{ value: 'Cytowania (Autorytet)', position: 'insideBottom', offset: -10, fill: '#4a7090', fontSize: 12 }} />
          <YAxis type="number" dataKey="y" name="Wzmianki" stroke="#4a7090" tick={{ fill: '#4a7090' }} label={{ value: 'Wzmianki (Świadomość)', angle: -90, position: 'insideLeft', fill: '#4a7090', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine x={xMedian} stroke="#4a7090" strokeOpacity={0.5} />
          <ReferenceLine y={yMedian} stroke="#4a7090" strokeOpacity={0.5} />
          <Scatter name="Marki" data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isBrand ? '#2edf8f' : '#ff5c6a'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
