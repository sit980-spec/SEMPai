import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Bot, User, Sparkles } from 'lucide-react';

export function AiResponseShowcase() {
  const { platformData, brand, brandVariants } = useStore();

  const showcaseData = useMemo(() => {
    let wins: any[] = [];
    let losses: any[] = [];
    let hijacks: any[] = [];
    
    const competitors = brand.competitors.map(c => c.trim()).filter(Boolean);
    const brandNames = [brand.name, ...brandVariants.map(v => v.text)].filter(Boolean).map(n => n.toLowerCase());

    const allRows = Object.values(platformData).flatMap(p => 
      p.rows.map((r: any) => ({ ...r, platform: p.name }))
    ).sort((a, b) => b.volume - a.volume);

    allRows.forEach(row => {
      if (!row.ai_response || row.ai_response.length < 50) return;

      const responseLower = row.ai_response.toLowerCase();
      const queryLower = row.query.toLowerCase();
      
      const queryHasBrand = brandNames.some(name => queryLower.includes(name));
      const responseHasCompetitor = competitors.find(c => responseLower.includes(c.toLowerCase()));
      
      // Check for hijacks
      if (queryHasBrand && responseHasCompetitor && !row.brand_mentioned && hijacks.length < 2) {
        hijacks.push({
          query: row.query,
          response: row.ai_response,
          platform: row.platform,
          type: 'hijack',
          competitor: responseHasCompetitor
        });
      }
      // Check for wins
      else if (row.brand_mentioned && wins.length < 2) {
        wins.push({
          query: row.query,
          response: row.ai_response,
          platform: row.platform,
          type: 'win'
        });
      } 
      // Check for losses (competitor mentioned, brand not mentioned)
      else if (!row.brand_mentioned && losses.length < 2) {
        if (responseHasCompetitor) {
          losses.push({
            query: row.query,
            response: row.ai_response,
            platform: row.platform,
            type: 'loss',
            competitor: responseHasCompetitor
          });
        }
      }
    });

    return { wins, losses, hijacks };
  }, [platformData, brand, brandVariants]);

  if (showcaseData.wins.length === 0 && showcaseData.losses.length === 0 && showcaseData.hijacks.length === 0) {
    return null;
  }

  const highlightText = (text: string, type: 'win' | 'loss' | 'hijack', competitor?: string) => {
    let highlightedText = text;
    
    if (type === 'win') {
      const brandNames = [brand.name, ...brandVariants.map(v => v.text)].filter(Boolean);
      brandNames.forEach(name => {
        const regex = new RegExp(`(${name})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span class="bg-[#2edf8f]/20 text-[#2edf8f] font-bold px-1 rounded">$1</span>');
      });
    } else if ((type === 'loss' || type === 'hijack') && competitor) {
      const regex = new RegExp(`(${competitor})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<span class="bg-[#ff5c6a]/20 text-[#ff5c6a] font-bold px-1 rounded">$1</span>');
    }

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const ChatBubble: React.FC<{ data: any }> = ({ data }) => (
    <div className="mb-6 last:mb-0">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#1a3354] flex items-center justify-center shrink-0">
          <User size={16} className="text-[#4a7090]" />
        </div>
        <div className="bg-[#1a3354] rounded-2xl rounded-tl-none px-4 py-2 text-sm text-[#e8f0ff] max-w-[80%]">
          {data.query}
        </div>
      </div>
      
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#2edf8f]/10 flex items-center justify-center shrink-0 border border-[#2edf8f]/30">
          <Bot size={16} className="text-[#2edf8f]" />
        </div>
        <div className="bg-[#112240] border border-[#1a3354] rounded-2xl rounded-tl-none px-4 py-3 text-sm text-[#a0b8d0] max-w-[90%] leading-relaxed">
          <div className="text-xs text-[#4a7090] mb-2 flex items-center gap-1">
            <Sparkles size={12} /> {data.platform}
          </div>
          {highlightText(data.response, data.type, data.competitor)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showcaseData.hijacks.length > 0 && (
        <div className="bg-[#ff5c6a]/10 border border-[#ff5c6a]/30 rounded-xl p-4">
          <h4 className="text-sm font-bold text-[#ff5c6a] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff5c6a] animate-pulse"></span>
            Zagrożenie: Konkurencja przejmuje Twoje zapytania brandowe (Brand Hijack)
          </h4>
          <div className="bg-[#07111f] rounded-xl p-4 border border-[#1a3354]">
            {showcaseData.hijacks.map((hijack, idx) => <ChatBubble key={`hijack-${idx}`} data={hijack} />)}
          </div>
        </div>
      )}

      {showcaseData.wins.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-[#2edf8f] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2edf8f] animate-pulse"></span>
            Przykłady Sukcesu (Brand Wins)
          </h4>
          <div className="bg-[#07111f] rounded-xl p-4 border border-[#1a3354]">
            {showcaseData.wins.map((win, idx) => <ChatBubble key={`win-${idx}`} data={win} />)}
          </div>
        </div>
      )}

      {showcaseData.losses.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-[#ff5c6a] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff5c6a] animate-pulse"></span>
            Przykłady Porażki (Competitor Wins)
          </h4>
          <div className="bg-[#07111f] rounded-xl p-4 border border-[#1a3354]">
            {showcaseData.losses.map((loss, idx) => <ChatBubble key={`loss-${idx}`} data={loss} />)}
          </div>
        </div>
      )}
    </div>
  );
}
