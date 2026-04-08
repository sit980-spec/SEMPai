import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Download, ExternalLink, CheckSquare, Square, RefreshCw, FileText, LayoutTemplate } from 'lucide-react';
import { asBlob } from 'html-docx-js-typescript';

export function ReportGenerator() {
  const { brand, brandVariants, platformData, gatekeeping, setGatekeeping, reportComment, setReportComment } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportVariant, setReportVariant] = useState<'A' | 'B' | 'C'>('A');

  const allRows = useMemo(() => {
    return Object.values(platformData).flatMap(p => p.rows);
  }, [platformData]);

  const stats = useMemo(() => {
    const total = allRows.length;
    const mentions = allRows.filter(r => r.brand_mentioned).length;
    const sov = total > 0 ? Math.min(100, Math.round((mentions / (mentions + (mentions * 0.5))) * 100)) : 0;
    const predictiveLift = brand.historicalSov > 0 ? (sov / brand.historicalSov) * brand.brandSearchGrowth : 0;
    return { total, mentions, sov, predictiveLift };
  }, [allRows, brand]);

  const generateAutoComment = () => {
    if (stats.total === 0) return "Brak danych do analizy.";
    
    let comment = `Analiza widoczności marki ${brand.name} w wynikach generatywnych AI (AI Overviews, ChatGPT, Gemini, itp.) wskazuje na AI Share of Voice (SOV) na poziomie ${stats.sov}%. `;
    
    if (stats.sov < 15) {
      comment += `Wynik ten jest poniżej średniej rynkowej. Zalecamy pilną optymalizację treści pod kątem intencji informacyjnych oraz budowę silniejszych sygnałów E-E-A-T, aby modele AI częściej uwzględniały markę w swoich odpowiedziach.`;
    } else if (stats.sov < 35) {
      comment += `Widoczność jest na umiarkowanym poziomie. Marka pojawia się w kluczowych zapytaniach, jednak istnieje spora przestrzeń do wzrostu, szczególnie w obszarze zapytań transakcyjnych. Warto skupić się na zamykaniu luk semantycznych (Semantic Entity Gap).`;
    } else {
      comment += `Marka dominuje w wynikach AI, osiągając bardzo wysoką ekspozycję. Strategia powinna skupić się na utrzymaniu tej pozycji, monitorowaniu nowych konkurentów oraz optymalizacji współczynnika klikalności (CTR) z cytowań poprzez wdrożenie zaawansowanego Schema.org.`;
    }
    
    return comment;
  };

  // Auto-generate comment on mount if empty
  useEffect(() => {
    if (!reportComment && stats.total > 0) {
      setReportComment(generateAutoComment());
    }
  }, [stats.total]);

  const topMentions = useMemo(() => {
    return allRows
      .filter(r => r.brand_mentioned)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);
  }, [allRows]);

  const topGaps = useMemo(() => {
    return allRows
      .filter(r => !r.brand_mentioned && (r.comp1_mentioned || r.comp2_mentioned || r.comp3_mentioned))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);
  }, [allRows]);

  const showcaseData = useMemo(() => {
    let wins: any[] = [];
    let losses: any[] = [];
    let hijacks: any[] = [];
    const competitors = brand.competitors.map(c => c.trim()).filter(Boolean);
    const brandNames = [brand.name, ...brandVariants.map(v => v.text)].filter(Boolean).map(n => n.toLowerCase());

    const allRowsSorted = Object.values(platformData).flatMap(p => 
      p.rows.map((r: any) => ({ ...r, platform: p.name }))
    ).sort((a, b) => b.volume - a.volume);

    allRowsSorted.forEach(row => {
      if (!row.ai_response || row.ai_response.length < 50) return;
      const responseLower = row.ai_response.toLowerCase();
      const queryLower = row.query.toLowerCase();
      
      const queryHasBrand = brandNames.some(name => queryLower.includes(name));
      const responseHasCompetitor = competitors.find(c => responseLower.includes(c.toLowerCase()));

      if (queryHasBrand && responseHasCompetitor && !row.brand_mentioned && hijacks.length < 2) {
        hijacks.push({ query: row.query, response: row.ai_response, platform: row.platform, type: 'hijack', competitor: responseHasCompetitor });
      } else if (row.brand_mentioned && wins.length < 2) {
        wins.push({ query: row.query, response: row.ai_response, platform: row.platform, type: 'win' });
      } else if (!row.brand_mentioned && losses.length < 2) {
        if (responseHasCompetitor) {
          losses.push({ query: row.query, response: row.ai_response, platform: row.platform, type: 'loss', competitor: responseHasCompetitor });
        }
      }
    });
    return { wins, losses, hijacks };
  }, [platformData, brand, brandVariants]);

  const isApproved = gatekeeping.industryMatch && gatekeeping.dataVerified;

  const highlightTextHtml = (text: string, type: 'win' | 'loss', competitor?: string) => {
    let highlightedText = text;
    if (type === 'win') {
      const brandNames = [brand.name, ...brandVariants.map(v => v.text)].filter(Boolean);
      brandNames.forEach(name => {
        const regex = new RegExp(`(${name})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span style="background-color: #d1fae5; color: #065f46; font-weight: bold; padding: 2px 4px; border-radius: 4px;">$1</span>');
      });
    } else if (type === 'loss' && competitor) {
      const regex = new RegExp(`(${competitor})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<span style="background-color: #fee2e2; color: #991b1b; font-weight: bold; padding: 2px 4px; border-radius: 4px;">$1</span>');
    }
    return highlightedText;
  };

  const buildHtml = () => {
    const mainCompetitor = brand.competitors[0] || "Konkurencja";
    
    let variantContent = '';

    if (reportVariant === 'A') {
      variantContent = `
        <div class="variant-section">
          <h2>Executive Summary</h2>
          <h3 style="color: #ff5c6a; font-size: 24px; margin-bottom: 10px;">Tylko ${Math.round(stats.sov / 10)} na 10 klientów pytających AI o Twoją branżę dowiaduje się o Tobie. Resztę zgarnia ${mainCompetitor}.</h3>
          <p>Twój obecny AI Share of Voice wynosi <strong>${stats.sov}%</strong>.</p>
          <p>Szacowany Predictive Brand Lift (utracony potencjał ruchu): <strong>+${stats.predictiveLift.toFixed(1)}%</strong></p>
          
          <h2>Jak AI widzi Cię dzisiaj (AI Response Showcase)</h2>
          ${showcaseData.hijacks && showcaseData.hijacks.length > 0 ? `
            <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h4 style="color: #e11d48; margin-top: 0;">Zagrożenie: Konkurencja przejmuje Twoje zapytania brandowe (Brand Hijack)</h4>
              ${showcaseData.hijacks.map((hijack: any) => `
                <div style="background: #ffffff; border: 1px solid #ffe4e6; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                  <p><strong>Zapytanie (${hijack.platform}):</strong> ${hijack.query}</p>
                  <p><strong>Odpowiedź AI:</strong> ${highlightTextHtml(hijack.response, 'loss', hijack.competitor)}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${showcaseData.wins.length > 0 ? `
            <h4 style="color: #065f46;">Przykłady Sukcesu (Brand Wins)</h4>
            ${showcaseData.wins.map(win => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p><strong>Zapytanie (${win.platform}):</strong> ${win.query}</p>
                <p><strong>Odpowiedź AI:</strong> ${highlightTextHtml(win.response, 'win')}</p>
              </div>
            `).join('')}
          ` : ''}
          ${showcaseData.losses.length > 0 ? `
            <h4 style="color: #991b1b;">Przykłady Porażki (Competitor Wins)</h4>
            ${showcaseData.losses.map(loss => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p><strong>Zapytanie (${loss.platform}):</strong> ${loss.query}</p>
                <p><strong>Odpowiedź AI:</strong> ${highlightTextHtml(loss.response, 'loss', loss.competitor)}</p>
              </div>
            `).join('')}
          ` : ''}
        </div>
      `;
    } else if (reportVariant === 'B') {
      variantContent = `
        <div class="variant-section">
          <h2>Content & Strategy Plan</h2>
          <p>Skup się na wypełnieniu poniższych luk semantycznych, aby zwiększyć widoczność w AI.</p>
          
          <h2>Top Luki Widoczności (Gaps)</h2>
          <table>
            <tr><th>Zapytanie</th><th>Wolumen</th><th>Rekomendacja</th></tr>
            ${topGaps.map(r => {
              const maxVol = Math.max(...topGaps.map(g => g.volume), 1);
              const percent = Math.round((r.volume / maxVol) * 100);
              return `
                <tr>
                  <td>${r.query}</td>
                  <td style="width: 150px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="min-width: 40px;">${r.volume}</span>
                      <div class="progress-container" style="flex-grow: 1;">
                        <div class="progress-bar" style="width: ${percent}%; background-color: #ff5c6a;"></div>
                      </div>
                    </div>
                  </td>
                  <td>Napisz artykuł FAQ lub zoptymalizuj pod kątem intencji informacyjnej.</td>
                </tr>
              `;
            }).join('')}
          </table>
        </div>
      `;
    } else if (reportVariant === 'C') {
      variantContent = `
        <div class="variant-section">
          <h2>Technical SEO Audit</h2>
          <p>Analiza techniczna sygnałów E-E-A-T i struktury danych.</p>
          
          <h2>Podsumowanie Platform</h2>
          <table>
            <tr>
              <th>Platforma</th>
              <th>Zapytania</th>
              <th>Wzmianki</th>
              <th>Cytowania</th>
              <th>SOV %</th>
              <th>Citation-to-Mention Ratio</th>
            </tr>
            ${Object.values(platformData).map(p => {
              const mentions = p.rows.filter(r => r.brand_mentioned).length;
              const citations = p.rows.filter(r => r.brand_cited).length;
              const sov = p.rows.length > 0 ? Math.min(100, Math.round((mentions / (mentions + (mentions * 0.5))) * 100)) : 0;
              const ratio = mentions > 0 ? (citations / mentions).toFixed(2) : '0.00';
              return `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.rows.length}</td>
                  <td>${mentions}</td>
                  <td>${citations}</td>
                  <td style="width: 150px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="min-width: 30px;">${sov}%</span>
                      <div class="progress-container" style="flex-grow: 1;">
                        <div class="progress-bar" style="width: ${sov}%;"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    ${ratio} 
                    ${parseFloat(ratio) < 1.0 ? '<span style="color: #ff5c6a; font-size: 10px;">(Audyt E-E-A-T)</span>' : '<span style="color: #2edf8f; font-size: 10px;">(Wdrożenie Schema.org)</span>'}
                  </td>
                </tr>
              `;
            }).join('')}
          </table>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Raport AI Visibility - ${brand.name}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; }
          h1 { color: #0f172a; border-bottom: 3px solid #2edf8f; padding-bottom: 10px; font-size: 28px; }
          h2 { color: #334155; margin-top: 30px; font-size: 22px; }
          h3 { color: #475569; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background-color: #f1f5f9; color: #334155; font-weight: bold; }
          .highlight { font-weight: bold; color: #2edf8f; }
          .progress-container { width: 100%; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; height: 8px; margin-top: 4px; }
          .progress-bar { height: 100%; background-color: #3b82f6; }
          .variant-section { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
        </style>
      </head>
      <body>
        <h1>Raport Widoczności AI: ${brand.name}</h1>
        <p><strong>Branża:</strong> ${brand.industry}</p>
        
        <h2>Komentarz Analityczny</h2>
        <p style="background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; font-style: italic;">
          ${reportComment.replace(/\n/g, '<br/>')}
        </p>

        ${variantContent}

      </body>
      </html>
    `;
  };

  const handleDownloadDocx = async () => {
    setIsGenerating(true);
    try {
      const html = buildHtml();
      const blob = await asBlob(html);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Raport_AI_Visibility_${brand.name || 'Sempai'}_Wariant_${reportVariant}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Błąd generowania DOCX:", error);
      alert("Wystąpił błąd podczas generowania pliku DOCX.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadHtml = () => {
    setIsGenerating(true);
    try {
      const html = buildHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Raport_AI_Visibility_${brand.name || 'Sempai'}_Wariant_${reportVariant}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Błąd generowania HTML:", error);
      alert("Wystąpił błąd podczas generowania pliku HTML.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewHtml = () => {
    const html = buildHtml();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-8 shadow-xl space-y-8">
      <h2 className="text-xl font-bold text-white mb-6">Raportowanie i Eksport</h2>
      
      {/* Variant Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#4a7090] uppercase tracking-wider">Wybierz Wariant Raportu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'A', title: 'Executive Summary', desc: 'Dla C-Level. Język biznesu, estymacje ruchu, cytaty AI.' },
            { id: 'B', title: 'Content & Strategy', desc: 'Dla Copywriterów. Luki semantyczne, rekomendacje.' },
            { id: 'C', title: 'Technical SEO', desc: 'Dla Deweloperów. Kanibalizacja, E-E-A-T, Schema.' }
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setReportVariant(v.id as any)}
              className={`p-4 rounded-xl border text-left transition-all ${reportVariant === v.id ? 'bg-[#1a3358] border-[#4da6ff] shadow-[0_0_15px_rgba(77,166,255,0.2)]' : 'bg-[#112240] border-[#1a3354] hover:border-[#4a7090]'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <LayoutTemplate size={16} className={reportVariant === v.id ? 'text-[#4da6ff]' : 'text-[#4a7090]'} />
                <span className={`font-bold ${reportVariant === v.id ? 'text-white' : 'text-[#a0b8d0]'}`}>Wariant {v.id}</span>
              </div>
              <div className="text-sm font-semibold text-white mb-1">{v.title}</div>
              <div className="text-xs text-[#4a7090]">{v.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editable Comment */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#4a7090] uppercase tracking-wider">Komentarz Analityczny</h3>
          <button 
            onClick={() => setReportComment(generateAutoComment())}
            className="text-xs text-[#4da6ff] hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} /> Przywróć Auto
          </button>
        </div>
        <textarea
          value={reportComment}
          onChange={(e) => setReportComment(e.target.value)}
          className="w-full h-32 bg-[#112240] border border-[#1a3354] rounded-xl p-4 text-white focus:outline-none focus:border-[#2edf8f] resize-none"
          placeholder="Wpisz komentarz analityczny..."
        />
      </div>

      {/* Top Queries Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-4">
          <h4 className="text-sm font-bold text-[#2edf8f] mb-3">Top Zapytania (Wzmianki)</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {topMentions.length === 0 ? <div className="text-xs text-[#4a7090]">Brak danych</div> : topMentions.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-xs border-b border-[#1a3354] pb-1">
                <span className="text-[#e8f0ff] truncate pr-2">{r.query}</span>
                <span className="text-[#4a7090] font-mono">{r.volume}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#112240] border border-[#1a3354] rounded-xl p-4">
          <h4 className="text-sm font-bold text-[#ff5c6a] mb-3">Luki Widoczności (Gaps)</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {topGaps.length === 0 ? <div className="text-xs text-[#4a7090]">Brak danych</div> : topGaps.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-xs border-b border-[#1a3354] pb-1">
                <span className="text-[#e8f0ff] truncate pr-2">{r.query}</span>
                <span className="text-[#4a7090] font-mono">{r.volume}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gatekeeping */}
      <div className="p-4 bg-[#112240] rounded-lg border border-[#1a3354] space-y-3">
        <h3 className="text-sm font-bold text-white mb-2">Gatekeeping (Wymagane zatwierdzenie)</h3>
        
        <label className="flex items-start gap-3 cursor-pointer group">
          <div onClick={() => setGatekeeping({ industryMatch: !gatekeeping.industryMatch })} className="mt-0.5">
            {gatekeeping.industryMatch ? <CheckSquare className="text-[#2edf8f]" size={18} /> : <Square className="text-[#4a7090] group-hover:text-[#2edf8f] transition-colors" size={18} />}
          </div>
          <span className="text-sm text-[#e8f0ff]">Wnioski i komentarz analityczny odpowiadają specyfice branży klienta.</span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div onClick={() => setGatekeeping({ dataVerified: !gatekeeping.dataVerified })} className="mt-0.5">
            {gatekeeping.dataVerified ? <CheckSquare className="text-[#2edf8f]" size={18} /> : <Square className="text-[#4a7090] group-hover:text-[#2edf8f] transition-colors" size={18} />}
          </div>
          <span className="text-sm text-[#e8f0ff]">Dane liczbowe zostały zweryfikowane i nie zawierają anomalii.</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-4 pt-4 border-t border-[#1a3354]">
        <button 
          onClick={handlePreviewHtml}
          className="bg-[#112240] text-white border border-[#1a3354] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#1a3358] transition-colors flex items-center gap-2"
        >
          <ExternalLink size={18} /> Otwórz podgląd (Drukuj do PDF)
        </button>
        <button 
          onClick={handleDownloadHtml}
          disabled={!isApproved || isGenerating}
          className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            isApproved && !isGenerating
              ? 'bg-[#4da6ff] text-[#07111f] hover:bg-[#3b82f6] shadow-[0_0_20px_rgba(77,166,255,0.3)]' 
              : 'bg-[#1a3354] text-[#4a7090] cursor-not-allowed'
          }`}
        >
          <Download size={18} /> {isGenerating ? 'Generowanie...' : 'Pobierz .html'}
        </button>
        <button 
          onClick={handleDownloadDocx}
          disabled={!isApproved || isGenerating}
          className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
            isApproved && !isGenerating
              ? 'bg-[#2edf8f] text-[#07111f] hover:bg-[#20b571] shadow-[0_0_20px_rgba(46,223,143,0.3)]' 
              : 'bg-[#1a3354] text-[#4a7090] cursor-not-allowed'
          }`}
        >
          <FileText size={18} /> {isGenerating ? 'Generowanie...' : 'Pobierz .docx'}
        </button>
      </div>
    </div>
  );
}
