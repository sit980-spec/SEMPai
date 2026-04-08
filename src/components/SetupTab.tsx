import React, { useEffect, useState } from 'react';
import { useStore, BrandVariant } from '../store/useStore';
import { Settings, X, Plus, RotateCcw, Info } from 'lucide-react';

const Tooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <div className="group relative inline-flex items-center ml-2 cursor-help align-middle">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-[#1a3358] text-xs text-white rounded-lg shadow-xl z-50 border border-[#4a7090] leading-relaxed font-normal normal-case">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a3358]"></div>
    </div>
  </div>
);

export function SetupTab() {
  const { brand, setBrand, brandVariants, setBrandVariants } = useStore();
  const [newVariant, setNewVariant] = useState('');

  // Auto-generate variants when URL changes
  useEffect(() => {
    if (!brand.url) return;
    
    // Only auto-generate if we don't have variants or user explicitly resets
    // We'll handle reset via a button, so here we just initialize if empty
    if (brandVariants.length === 0) {
      generateAutoVariants(brand.url);
    }
  }, [brand.url]);

  const generateAutoVariants = (url: string) => {
    try {
      // Clean URL
      let cleanUrl = url.toLowerCase().trim();
      if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
      
      const urlObj = new URL(cleanUrl);
      let hostname = urlObj.hostname;
      
      // Remove www.
      hostname = hostname.replace(/^www\./, '');
      
      // Split by dots
      const parts = hostname.split('.');
      const baseName = parts[0]; // e.g., 'sempai' from 'sempai.pl'
      
      // Remove stop-words from baseName (e.g. sklep-sempai -> sempai)
      const stopWords = ['sklep', 'online', 'hurtownia', 'pl', 'com', 'eu'];
      let cleanedBaseName = baseName;
      stopWords.forEach(word => {
        const regex = new RegExp(`^${word}-|-${word}$|^${word}$`, 'g');
        cleanedBaseName = cleanedBaseName.replace(regex, '');
      });
      
      const variants: BrandVariant[] = [
        { text: cleanedBaseName, type: 'auto' },
        { text: hostname, type: 'auto' }
      ];

      if (baseName !== cleanedBaseName) {
        variants.push({ text: baseName, type: 'auto' });
      }

      // Remove duplicates
      const uniqueVariants = Array.from(new Map(variants.map(item => [item.text, item])).values());
      setBrandVariants(uniqueVariants);
    } catch (e) {
      // Invalid URL, do nothing
    }
  };

  const handleResetVariants = () => {
    generateAutoVariants(brand.url);
  };

  const handleAddVariant = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter') || e.type === 'click') {
      e.preventDefault();
      const val = newVariant.trim();
      if (val && !brandVariants.some(v => v.text.toLowerCase() === val.toLowerCase())) {
        setBrandVariants([...brandVariants, { text: val, type: 'manual' }]);
        setNewVariant('');
      }
    }
  };

  const handleRemoveVariant = (text: string) => {
    setBrandVariants(brandVariants.filter(v => v.text !== text));
  };

  const handleCompetitorsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrand({ competitors: e.target.value.split(',').map(s => s.trim()) });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0c1a2e] border border-[#1a3354] rounded-2xl p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="text-[#2edf8f]" /> Dane Klienta (Setup)
        </h2>
        
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Nazwa marki</label>
              <input type="text" value={brand.name} onChange={e => setBrand({name: e.target.value})} className="w-full bg-[#112240] border border-[#1a3354] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2edf8f]" placeholder="np. Sempai" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Główny URL</label>
              <input type="text" value={brand.url} onChange={e => setBrand({url: e.target.value})} className="w-full bg-[#112240] border border-[#1a3354] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2edf8f]" placeholder="np. sempai.pl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Branża</label>
            <select 
              value={brand.industry} 
              onChange={e => setBrand({industry: e.target.value})} 
              className="w-full bg-[#112240] border border-[#1a3354] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2edf8f] appearance-none"
            >
              <option value="Sklep">Sklep (E-commerce)</option>
              <option value="Hurtownia">Hurtownia (B2B)</option>
              <option value="Blog">Blog / Portal</option>
              <option value="Usługi">Usługi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">Główni konkurenci (po przecinku)</label>
            <input type="text" value={brand.competitors.join(', ')} onChange={handleCompetitorsChange} className="w-full bg-[#112240] border border-[#1a3354] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2edf8f]" placeholder="np. Konkurent A, Konkurent B" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">
                Historyczny SOV (%)
                <Tooltip text="Wartość SOV z poprzedniego kwartału. Jeśli to pierwszy raport dla klienta, zostaw puste (moduł predykcji zostanie ukryty w raporcie).">
                  <Info size={14} className="text-[#4a7090] hover:text-[#2edf8f] transition-colors" />
                </Tooltip>
              </label>
              <input type="number" value={brand.historicalSov} onChange={e => setBrand({historicalSov: Number(e.target.value)})} className="w-full bg-[#112240] border border-[#1a3354] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2edf8f]" placeholder="np. 10" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a7090] uppercase tracking-wider mb-2">
                Wzrost wyszukiwań brandowych (%)
                <Tooltip text="Źródło: Google Search Console. Porównaj zapytania brandowe (Y/Y lub Q/Q) i wpisz zmianę procentową.">
                  <Info size={14} className="text-[#4a7090] hover:text-[#2edf8f] transition-colors" />
                </Tooltip>
              </label>
              <input type="number" value={brand.brandSearchGrowth} onChange={e => setBrand({brandSearchGrowth: Number(e.target.value)})} className="w-full bg-[#112240] border border-[#1a3354] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2edf8f]" placeholder="np. 5" />
            </div>
          </div>

          {/* Brand Variants Management */}
          <div className="pt-4 border-t border-[#1a3354]">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-[#4a7090] uppercase tracking-wider">Warianty Marki (Brand Variants)</label>
              <button onClick={handleResetVariants} className="text-xs text-[#4da6ff] hover:text-white flex items-center gap-1 transition-colors">
                <RotateCcw size={12} /> Resetuj do domyślnych
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {brandVariants.map((variant, i) => (
                <div key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  variant.type === 'auto' 
                    ? 'bg-[#2edf8f]/10 text-[#2edf8f] border-[#2edf8f]/30' 
                    : 'bg-[#4da6ff]/10 text-[#4da6ff] border-[#4da6ff]/30'
                }`}>
                  {variant.text}
                  <button onClick={() => handleRemoveVariant(variant.text)} className="ml-1 opacity-70 hover:opacity-100 hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={newVariant} 
                onChange={e => setNewVariant(e.target.value)}
                onKeyDown={handleAddVariant}
                className="w-full bg-[#112240] border border-[#1a3354] rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-[#4da6ff]" 
                placeholder="Dodaj własny wariant (np. Garden Space) i wciśnij Enter" 
              />
              <button 
                onClick={handleAddVariant}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#4a7090] hover:text-[#4da6ff] transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className="text-[10px] text-[#4a7090] mt-2">
              Uwaga: Zmiana wariantów automatycznie przeliczy wgrane wcześniej dane w tle.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
