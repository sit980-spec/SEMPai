import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from './store/useStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SignalScanner, PLATFORMS } from './components/SignalScanner';
import { IntentMatrix } from './components/IntentMatrix';
import { CannibalizationChecker } from './components/CannibalizationChecker';
import { QuickWins } from './components/QuickWins';
import { SemanticEntityGap } from './components/SemanticEntityGap';
import { ReportGenerator } from './components/ReportGenerator';
import { CitationMentionRatio } from './components/CitationMentionRatio';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { InstructionTab } from './components/InstructionTab';
import { SetupTab } from './components/SetupTab';
import { ImportTab } from './components/ImportTab';
import { DashboardCharts } from './components/DashboardCharts';
import { MagicQuadrant } from './components/MagicQuadrant';
import { AiResponseShowcase } from './components/AiResponseShowcase';
import { Upload, FileText, BarChart2, Settings, X, Search, Activity, BookOpen, Loader2, Maximize, Minimize } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const S = {
  navy1: "#07111f", navy2: "#0c1a2e", navy3: "#112240", navy4: "#1a3358",
  green: "#2edf8f", greenD: "#20b571", coral: "#ff5c6a",
  gold: "#f5c842", sky: "#4da6ff", purple: "#a78bfa",
  text: "#e8f0ff", muted: "#4a7090", border: "#1a3354",
};

function DropZone({ label, color = S.green, onData, hasData, onClear, platformId, competitors }: any) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  
  const handle = (file: File) => {
    setLoading(true);
    const worker = new Worker(new URL('./workers/csvParser.worker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      if (e.data.error) {
        console.error("Worker error:", e.data.error);
        alert("Błąd parsowania pliku CSV.");
      } else {
        onData(e.data.rows);
      }
      setLoading(false);
      worker.terminate();
    };

    worker.postMessage({ file, platformId, competitors });
  };

  return (
    <div className="relative">
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); }}
        onClick={() => !loading && ref.current?.click()}
        style={{
          border: `1.5px dashed ${drag ? color : hasData ? color + "88" : S.border}`,
          borderRadius: 10, padding: "16px 8px", cursor: loading ? 'wait' : "pointer", textAlign: "center",
          background: drag ? color + "12" : hasData ? color + "09" : "transparent", transition: "all .2s"
        }}>
        <input ref={ref} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handle(e.target.files[0]); }} />
        <div style={{ fontSize: 18, marginBottom: 4 }}>{loading ? "⏳" : hasData ? "✅" : "📂"}</div>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: hasData ? color : S.muted }}>
          {loading ? "Przetwarzanie..." : hasData ? "Załadowano" : "Upuść CSV"}
        </div>
        {label && <div style={{ fontSize: 9, color: "#4a7090", marginTop: 2 }}>{label}</div>}
      </div>
      {hasData && !loading && (
        <button 
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute -top-2 -right-2 bg-[#112240] border border-[#1a3354] rounded-full p-1 text-red-400 hover:text-red-300 hover:bg-[#1a3358] transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: S.navy3, border: `1px solid ${S.border}`, borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontSize: 10, color: S.muted, marginBottom: 5 }}>{label}</div>
      {payload.map((p: any, i: number) => <div key={i} style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('instruction');
  const { brand, brandVariants, platformData, setPlatformData, uploadedFiles, searchQuery, setSearchQuery, addDiagnosticLog, isProcessing, setIsProcessing } = useStore();

  const [presentationMode, setPresentationMode] = useState(false);

  const competitorsArray = useMemo(() => 
    brand.competitors.map(c => c.trim()).filter(Boolean),
  [brand.competitors]);

  // Re-parse files when brandVariants change
  useEffect(() => {
    if (brandVariants.length === 0 || Object.keys(uploadedFiles).length === 0) return;
    
    setIsProcessing(true);
    let completed = 0;
    const total = Object.keys(uploadedFiles).length;

    Object.entries(uploadedFiles).forEach(([platformId, file]) => {
      const worker = new Worker(new URL('./workers/csvParser.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (ev) => {
        if (!ev.data.error) {
          const platform = PLATFORMS.find(p => p.id === platformId);
          if (platform) {
            setPlatformData(platformId, { id: platformId, name: platform.name, rows: ev.data.rows });
          }
        }
        worker.terminate();
        completed++;
        if (completed === total) setIsProcessing(false);
      };
      worker.postMessage({ file, platformId, competitors: competitorsArray, brandVariants });
    });
  }, [brandVariants, uploadedFiles, competitorsArray, setPlatformData, setIsProcessing]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return platformData;
    const lowerQuery = searchQuery.toLowerCase();
    const res: Record<string, any> = {};
    Object.keys(platformData).forEach(id => {
      res[id] = {
        ...platformData[id],
        rows: platformData[id].rows.filter(row => row.query.toLowerCase().includes(lowerQuery))
      };
    });
    return res;
  }, [platformData, searchQuery]);

  const stats = useMemo(() => {
    let totalQ = 0, totalM = 0, totalC = 0;
    PLATFORMS.forEach(p => {
      const d = filteredData[p.id];
      if (d) {
        totalQ += d.rows.length;
        totalM += d.rows.filter((r: any) => r.brand_mentioned).length;
        totalC += d.rows.filter((r: any) => r.brand_cited).length;
      }
    });
    
    // Simplified SOV calculation for display
    const avgSOV = totalM > 0 ? Math.min(100, Math.round((totalM / (totalM + (totalM * 0.5))) * 100)) : 0;

    // Predictive Brand Lift calculation
    const predictiveLift = brand.historicalSov > 0 
      ? (avgSOV / brand.historicalSov) * brand.brandSearchGrowth 
      : 0;

    return { totalQ, totalM, totalC, avgSOV, predictiveLift };
  }, [filteredData, brand.historicalSov, brand.brandSearchGrowth]);

  const SkeletonLoader = ({ height = "h-64" }) => (
    <div className={`w-full ${height} bg-[#112240] rounded-xl animate-pulse flex items-center justify-center border border-[#1a3354]`}>
      <Loader2 className="animate-spin text-[#4a7090]" size={32} />
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#07111f] text-[#e8f0ff] font-sans selection:bg-[#2edf8f] selection:text-[#07111f] flex flex-col ${presentationMode ? 'overflow-hidden' : ''}`}>
      {!presentationMode && (
        <header className="relative border-b border-[#1a3354] bg-[#0c1a2e]/80 backdrop-blur-md z-10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#07111f] rounded-xl flex items-center justify-center font-black text-xl text-[#2edf8f] border-2 border-[#2edf8f]/30">
                S
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">sempai <span className="text-[10px] text-[#2edf8f] bg-[#2edf8f]/10 border border-[#2edf8f]/30 px-2 py-0.5 rounded uppercase ml-2">AI Visibility</span></h1>
                <p className="text-xs text-[#4a7090] mt-0.5 font-medium">Let us perform! • Generator Raportów</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'instruction', icon: BookOpen, label: 'Instrukcja' },
                { id: 'data', icon: Settings, label: 'Dane Klienta' },
                { id: 'import', icon: Upload, label: 'Import CSV' },
                { id: 'dashboard', icon: BarChart2, label: 'Dashboard' },
                { id: 'report', icon: FileText, label: 'Raportowanie' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-[#2edf8f] text-[#07111f] shadow-[0_0_15px_rgba(46,223,143,0.3)]' 
                      : 'bg-[#112240] text-[#4a7090] hover:bg-[#1a3358] hover:text-white'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => { setPresentationMode(true); setActiveTab('dashboard'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-[#112240] text-[#4a7090] hover:bg-[#1a3358] hover:text-white ml-4 border border-[#1a3354]"
                title="Tryb Prezentacji"
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
        </header>
      )}

      {presentationMode && (
        <button
          onClick={() => setPresentationMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all bg-[#1a3358] text-white hover:bg-[#ff5c6a] shadow-xl border border-[#4a7090]"
        >
          <Minimize size={16} /> Wyjdź z trybu prezentacji
        </button>
      )}

      <main className={`flex-1 w-full mx-auto ${presentationMode ? 'p-4 h-screen overflow-y-auto max-w-full' : 'p-6 max-w-7xl'}`}>
        <ErrorBoundary>
          {activeTab === 'instruction' && <InstructionTab onStart={() => setActiveTab('data')} />}
          {activeTab === 'data' && <SetupTab />}
          {activeTab === 'import' && <ImportTab />}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a7090]" size={18} />
                <input type="text" placeholder="Filtruj po zapytaniach (query)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#0c1a2e] border border-[#1a3354] rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#2edf8f] shadow-lg" />
              </div>

              {isProcessing ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <SkeletonLoader height="h-24" />
                    <SkeletonLoader height="h-24" />
                    <SkeletonLoader height="h-24" />
                    <SkeletonLoader height="h-24" />
                    <SkeletonLoader height="h-24" />
                  </div>
                  <SkeletonLoader height="h-72" />
                  <SkeletonLoader height="h-96" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-5 shadow-lg border-t-2 border-t-[#2edf8f]">
                      <div className="text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Średni AI SOV</div>
                      <div className="text-3xl font-black text-white">{stats.avgSOV}%</div>
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-5 shadow-lg border-t-2 border-t-[#f5c842]">
                      <div className="text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Predictive Brand Lift</div>
                      <div className="text-3xl font-black text-[#f5c842]">{stats.predictiveLift > 0 ? '+' : ''}{stats.predictiveLift.toFixed(1)}%</div>
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-5 shadow-lg border-t-2 border-t-[#4da6ff]">
                      <div className="text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Brand Mentions</div>
                      <div className="text-3xl font-black text-white">{stats.totalM}</div>
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-5 shadow-lg border-t-2 border-t-[#a78bfa]">
                      <div className="text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Citations</div>
                      <div className="text-3xl font-black text-white">{stats.totalC}</div>
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-5 shadow-lg border-t-2 border-t-[#ff5c6a]">
                      <div className="text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Zbadane Zapytania</div>
                      <div className="text-3xl font-black text-white">{stats.totalQ}</div>
                    </div>
                  </div>

                  <DashboardCharts />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-6 shadow-xl">
                      <h3 className="text-sm font-bold text-[#4a7090] uppercase tracking-wider mb-6">AI Signal Scanner 2.0</h3>
                      <SignalScanner data={filteredData} />
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-6 shadow-xl">
                      <h3 className="text-sm font-bold text-[#4a7090] uppercase tracking-wider mb-6">Magic Quadrant</h3>
                      <MagicQuadrant />
                    </div>
                  </div>

                  <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-[#4a7090] uppercase tracking-wider mb-6">AI Response Showcase (Łapacz Cytatów)</h3>
                    <AiResponseShowcase />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6 shadow-lg lg:col-span-2">
                      <CitationMentionRatio />
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6 shadow-lg">
                      <h3 className="text-sm font-bold text-white mb-6">Macierz Intencji</h3>
                      <IntentMatrix />
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6 shadow-lg">
                      <h3 className="text-sm font-bold text-white mb-6">Quick Wins</h3>
                      <QuickWins />
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6 shadow-lg lg:col-span-2">
                      <h3 className="text-sm font-bold text-white mb-6">Cannibalization Checker</h3>
                      <CannibalizationChecker />
                    </div>
                    <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6 shadow-lg lg:col-span-2">
                      <h3 className="text-sm font-bold text-white mb-6">Semantic Entity Gap</h3>
                      <SemanticEntityGap />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'report' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReportGenerator />
            </div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
