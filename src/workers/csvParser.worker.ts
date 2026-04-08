import Papa from 'papaparse';

self.onmessage = (e: MessageEvent) => {
  const { file, platformId, competitors, brandVariants } = e.data;
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.data.length === 0) {
        self.postMessage({ platformId, error: "Plik CSV jest pusty lub niepoprawnie sformatowany." });
        return;
      }

      // Check required columns
      const firstRow = results.data[0] as any;
      const keys = Object.keys(firstRow).map(k => k.trim().toLowerCase().replace(/\s+/g, "_"));
      
      const hasQuery = keys.includes('query') || keys.includes('keyword');
      const hasVolume = keys.includes('volume');
      
      if (!hasQuery || !hasVolume) {
        self.postMessage({ platformId, error: `Błąd struktury pliku. Upewnij się, że eksportujesz widok z włączonymi kolumnami Keyword/Query oraz Volume bezpośrednio z Ahrefs AI Responses.` });
        return;
      }

      let warning = null;
      if (!keys.includes('brand_mentioned') || !keys.includes('brand_cited')) {
        warning = "Brak kolumn 'brand_mentioned' lub 'brand_cited'. Wartości zostaną wyliczone z tekstu lub ustawione na false.";
      }

      const rows = results.data.map((row: any) => {
        // Normalize keys
        const normalizedRow: any = {};
        for (const key in row) {
          normalizedRow[key.trim().toLowerCase().replace(/\s+/g, "_")] = row[key];
        }
        
        let brand_mentioned = normalizedRow.brand_mentioned === '1' || String(normalizedRow.brand_mentioned).toLowerCase() === 'true';
        let brand_cited = normalizedRow.brand_cited === '1' || String(normalizedRow.brand_cited).toLowerCase() === 'true';

        const aiResponse = normalizedRow.ai_response || normalizedRow.response || normalizedRow.snippet || normalizedRow.text || normalizedRow.answer || '';

        // If brandVariants are provided and we have a text/snippet column, try to detect mentions
        if (brandVariants && brandVariants.length > 0) {
          const textToSearch = aiResponse.toLowerCase();
          if (textToSearch) {
            const hasMention = brandVariants.some((v: any) => textToSearch.includes(v.text.toLowerCase()));
            if (hasMention) brand_mentioned = true;
          }
        }

        // Parse volume robustly
        let volume = 0;
        if (normalizedRow.volume) {
          const parsedVol = parseInt(String(normalizedRow.volume).replace(/[^0-9-]/g, ''), 10);
          if (!isNaN(parsedVol)) volume = parsedVol;
        }

        // Parse booleans and volume
        const parsedRow: any = {
          query: normalizedRow.query || normalizedRow.keyword || '',
          volume,
          brand_mentioned,
          brand_cited,
          intent: normalizedRow.intent || 'Informacyjne',
          url: normalizedRow.url || '',
          ai_response: aiResponse,
        };

        competitors.forEach((c: string, i: number) => {
          const compKeyM = `comp${i+1}_mentioned`;
          const compKeyC = `comp${i+1}_cited`;
          parsedRow[compKeyM] = normalizedRow[compKeyM] === '1' || String(normalizedRow[compKeyM]).toLowerCase() === 'true';
          parsedRow[compKeyC] = normalizedRow[compKeyC] === '1' || String(normalizedRow[compKeyC]).toLowerCase() === 'true';
        });

        return parsedRow;
      });
      
      self.postMessage({ platformId, rows, warning });
    },
    error: (error) => {
      self.postMessage({ platformId, error: `Błąd parsowania: ${error.message}` });
    }
  });
};
