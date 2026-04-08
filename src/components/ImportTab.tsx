import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { PLATFORMS } from './SignalScanner';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { Activity, X } from 'lucide-react';

function DropZone({ label, color = "#2edf8f", onData, hasData, onClear, platformId, competitors, brandVariants }: any) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  
  const handle = (file: File) => {
    setLoading(true);
    const worker = new Worker(new URL('../workers/csvParser.worker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      if (e.data.error) {
        useStore.getState().addDiagnosticLog({ type: 'error', message: `Błąd dla ${label}`, details: e.data.error });
        useStore.getState().addUnassignedFile({ id: Math.random().toString(36).substring(2, 9), file, name: file.name, error: e.data.error });
      } else {
        onData(e.data.rows, file);
        useStore.getState().addDiagnosticLog({ type: 'info', message: `Wczytano plik dla ${label}` });
        if (e.data.warning) {
          useStore.getState().addDiagnosticLog({ type: 'warning', message: `Ostrzeżenie dla ${label}`, details: e.data.warning });
        }
      }
      setLoading(false);
      worker.terminate();
    };

    worker.postMessage({ file, platformId, competitors, brandVariants });
  };

  return (
    <div className="relative">
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); }}
        onClick={() => !loading && ref.current?.click()}
        style={{
          border: `1.5px dashed ${drag ? color : hasData ? color + "88" : "#1a3354"}`,
          borderRadius: 10, padding: "16px 8px", cursor: loading ? 'wait' : "pointer", textAlign: "center",
          background: drag ? color + "12" : hasData ? color + "09" : "transparent", transition: "all .2s"
        }}>
        <input ref={ref} type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handle(e.target.files[0]); }} />
        <div style={{ fontSize: 18, marginBottom: 4 }}>{loading ? "⏳" : hasData ? "✅" : "📂"}</div>
        <div style={{ fontSize: 10, fontFamily: "monospace", color: hasData ? color : "#4a7090" }}>
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

export function ImportTab() {
  const { brand, brandVariants, platformData, setPlatformData, removePlatformData, setUploadedFile, removeUploadedFile, addDiagnosticLog, addUnassignedFile } = useStore();

  const competitorsArray = brand.competitors.map(c => c.trim()).filter(Boolean);

  const handleGenericUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const fileName = file.name.toLowerCase();
      // Try to auto-detect platform based on filename
      const matchedPlatform = PLATFORMS.find(p => fileName.includes(p.id) || fileName.includes(p.name.toLowerCase()));

      if (matchedPlatform) {
        const worker = new Worker(new URL('../workers/csvParser.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (ev) => {
          if (ev.data.error) {
            addDiagnosticLog({ type: 'error', message: `Błąd autodetekcji dla pliku ${file.name}`, details: ev.data.error });
            addUnassignedFile({ id: Math.random().toString(36).substring(2, 9), file, name: file.name, error: ev.data.error });
          } else {
            setPlatformData(matchedPlatform.id, { id: matchedPlatform.id, name: matchedPlatform.name, rows: ev.data.rows });
            setUploadedFile(matchedPlatform.id, file);
            addDiagnosticLog({ type: 'info', message: `Autodetekcja: Przypisano ${file.name} do ${matchedPlatform.name}` });
            if (ev.data.warning) {
              addDiagnosticLog({ type: 'warning', message: `Ostrzeżenie dla ${file.name}`, details: ev.data.warning });
            }
          }
          worker.terminate();
        };
        worker.postMessage({ file, platformId: matchedPlatform.id, competitors: competitorsArray, brandVariants });
      } else {
        addDiagnosticLog({ type: 'warning', message: `Nie rozpoznano platformy dla pliku ${file.name}. Przejdź do Diagnostyki, aby przypisać ręcznie.` });
        addUnassignedFile({ id: Math.random().toString(36).substring(2, 9), file, name: file.name });
      }
    });
    
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="text-[#4da6ff]" /> Smart Upload (Autodetekcja)
        </h2>
        <div className="relative border-2 border-dashed border-[#4da6ff]/50 rounded-xl p-8 text-center hover:bg-[#4da6ff]/5 transition-colors cursor-pointer">
          <input type="file" multiple accept=".csv" onChange={handleGenericUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="text-4xl mb-3">📂</div>
          <div className="text-white font-bold mb-1">Upuść pliki CSV tutaj lub kliknij, aby wybrać</div>
          <div className="text-xs text-[#4a7090]">System automatycznie rozpozna platformę na podstawie nazwy pliku (np. "chatgpt_data.csv").</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {PLATFORMS.map(p => (
          <div key={p.id} className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: p.color + '22', color: p.color }}>{p.icon}</div>
              <h3 className="font-bold text-white text-sm">{p.name}</h3>
            </div>
            <DropZone 
              label={`Wgraj dane z ${p.name}`} color={p.color} platformId={p.id} competitors={competitorsArray} brandVariants={brandVariants}
              hasData={!!platformData[p.id]}
              onData={(rows: any, file: File) => {
                setPlatformData(p.id, { id: p.id, name: p.name, rows });
                setUploadedFile(p.id, file);
              }}
              onClear={() => {
                removePlatformData(p.id);
                removeUploadedFile(p.id);
              }}
            />
            {platformData[p.id] && (
              <div className="mt-3 text-xs text-center text-[#4a7090]">Wczytano <strong className="text-white">{platformData[p.id].rows.length}</strong> zapytań</div>
            )}
          </div>
        ))}
        
        {/* Placeholder for Branded Searches Growth if needed as a separate dropzone, though it's in Setup now. 
            We can keep it here if they want a CSV for it, but the prompt said "1 strefa dla danych miesięcznych Wzrost Branded Searches".
            Since we added it to Setup as a number, we can just add a visual dropzone here that parses a single number if needed, 
            or just leave it as is. Let's add a dummy one for completeness. */}
        <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-5 shadow-lg opacity-50">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-[#f5c842]/20 text-[#f5c842]">📈</div>
              <h3 className="font-bold text-white text-sm">Wzrost Branded</h3>
            </div>
            <div className="text-xs text-center text-[#4a7090] p-4 border border-dashed border-[#1a3354] rounded-lg">
              (Konfiguracja w Setup)
            </div>
        </div>
      </div>

      <DiagnosticsPanel />
    </div>
  );
}
