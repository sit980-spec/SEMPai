import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { PLATFORMS } from './SignalScanner';
import { AlertCircle, CheckCircle, Info, Trash2, UploadCloud } from 'lucide-react';

export function DiagnosticsPanel() {
  const { diagnosticLogs, clearDiagnosticLogs, unassignedFiles, removeUnassignedFile, setPlatformData, brand } = useStore();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const handleAssign = (fileId: string, platformId: string) => {
    const fileObj = unassignedFiles.find(f => f.id === fileId);
    if (!fileObj) return;

    setAssigningId(fileId);
    const worker = new Worker(new URL('../workers/csvParser.worker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      if (e.data.error) {
        useStore.getState().addDiagnosticLog({
          type: 'error',
          message: `Błąd podczas ręcznego przypisywania pliku ${fileObj.name}`,
          details: e.data.error
        });
      } else {
        const platform = PLATFORMS.find(p => p.id === platformId);
        if (platform) {
          setPlatformData(platformId, { id: platformId, name: platform.name, rows: e.data.rows });
          removeUnassignedFile(fileId);
          useStore.getState().addDiagnosticLog({
            type: 'info',
            message: `Pomyślnie przypisano plik ${fileObj.name} do platformy ${platform.name}`
          });
        }
      }
      setAssigningId(null);
      worker.terminate();
    };

    worker.postMessage({ file: fileObj.file, platformId, competitors: brand.competitors });
  };

  return (
    <div className="space-y-6">
      {/* Unassigned Files */}
      {unassignedFiles.length > 0 && (
        <div className="bg-[#ff5c6a]/10 border border-[#ff5c6a]/30 rounded-xl p-6">
          <h3 className="text-sm font-bold text-[#ff5c6a] mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> Pliki wymagające ręcznego przypisania
          </h3>
          <div className="space-y-3">
            {unassignedFiles.map(file => (
              <div key={file.id} className="bg-[#0c1a2e] border border-[#1a3354] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-sm text-[#e8f0ff]">{file.name}</div>
                  {file.error && <div className="text-xs text-[#ff5c6a] mt-1">{file.error}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className="bg-[#112240] border border-[#1a3354] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#2edf8f]"
                    onChange={(e) => {
                      if (e.target.value) handleAssign(file.id, e.target.value);
                    }}
                    value=""
                    disabled={assigningId === file.id}
                  >
                    <option value="" disabled>Wybierz platformę...</option>
                    {PLATFORMS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => removeUnassignedFile(file.id)}
                    className="p-2 text-[#4a7090] hover:text-[#ff5c6a] transition-colors"
                    title="Usuń plik"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic Logs */}
      <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Info size={18} className="text-[#4da6ff]" /> Logi Systemowe
          </h3>
          {diagnosticLogs.length > 0 && (
            <button onClick={clearDiagnosticLogs} className="text-xs text-[#4a7090] hover:text-white transition-colors">
              Wyczyść logi
            </button>
          )}
        </div>
        
        {diagnosticLogs.length === 0 ? (
          <div className="text-center text-[#4a7090] text-sm py-4">Brak logów diagnostycznych.</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {diagnosticLogs.map(log => (
              <div key={log.id} className={`p-3 rounded-lg border text-sm flex items-start gap-3 ${
                log.type === 'error' ? 'bg-[#ff5c6a]/10 border-[#ff5c6a]/30 text-[#ff5c6a]' :
                log.type === 'warning' ? 'bg-[#f5c842]/10 border-[#f5c842]/30 text-[#f5c842]' :
                'bg-[#2edf8f]/10 border-[#2edf8f]/30 text-[#2edf8f]'
              }`}>
                {log.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> :
                 log.type === 'warning' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> :
                 <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                <div>
                  <div className="font-bold">{log.message}</div>
                  {log.details && <div className="text-xs mt-1 opacity-80 font-mono">{log.details}</div>}
                  <div className="text-[10px] mt-1 opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
