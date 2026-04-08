import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export function DashboardCharts() {
  const { platformData, searchQuery, brand } = useStore();

  const chartData = useMemo(() => {
    const data: any[] = [];
    
    Object.values(platformData).forEach(platform => {
      let rows = platform.rows;
      
      // Apply search filter if exists
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        rows = rows.filter(r => r.query.toLowerCase().includes(q));
      }

      const total = rows.length;
      if (total === 0) return;

      const mentions = rows.filter(r => r.brand_mentioned).length;
      const citations = rows.filter(r => r.brand_cited).length;
      const sov = Math.min(100, Math.round((mentions / (mentions + (mentions * 0.5))) * 100)) || 0;

      // Calculate competitor SOVs to find leader
      const compMentions = brand.competitors.map((c, i) => {
        const m = rows.filter(r => r[`comp${i+1}_mentioned`]).length;
        const cSov = Math.min(100, Math.round((m / (m + (m * 0.5))) * 100)) || 0;
        return { name: c, sov: cSov };
      });
      
      const leader = compMentions.sort((a, b) => b.sov - a.sov)[0];

      data.push({
        name: platform.name,
        Mentions: mentions,
        Citations: citations,
        SOV: sov,
        Total: total,
        leader: leader && leader.sov > sov ? leader : null
      });
    });

    return data;
  }, [platformData, searchQuery, brand]);

  if (chartData.length === 0) {
    return null;
  }

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#112240] border border-[#1a3354] p-3 rounded-lg shadow-xl">
          <p className="font-bold text-[#2edf8f] mb-1">{data.name}</p>
          <p className="text-sm text-[#e8f0ff]">SOV: {data.SOV}%</p>
          {data.leader && (
            <p className="text-xs text-[#ff5c6a] mt-2 pt-2 border-t border-[#1a3354]">
              Brakuje {data.leader.sov - data.SOV}% SOV do dogonienia lidera: {data.leader.name}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-6">Wzmianki vs Cytowania</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3354" vertical={false} />
              <XAxis dataKey="name" stroke="#4a7090" tick={{ fill: '#4a7090', fontSize: 12 }} />
              <YAxis stroke="#4a7090" tick={{ fill: '#4a7090', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#112240', borderColor: '#1a3354', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#e8f0ff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#4a7090' }} />
              <Bar dataKey="Mentions" name="Wzmianki" fill="#4da6ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Citations" name="Cytowania" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-6">Share of Voice (SOV) per Platforma</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="#1a3354" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#4a7090', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4a7090', fontSize: 10 }} />
              <Radar name="SOV %" dataKey="SOV" stroke="#2edf8f" fill="#2edf8f" fillOpacity={0.3} />
              <Tooltip content={<CustomRadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
