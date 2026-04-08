import React, { useRef, useEffect } from 'react';

const S = {
  navy1: "#07111f", navy2: "#0c1a2e", navy3: "#112240", navy4: "#1a3358",
  green: "#2edf8f", greenD: "#20b571", coral: "#ff5c6a",
  gold: "#f5c842", sky: "#4da6ff", purple: "#a78bfa",
  text: "#e8f0ff", muted: "#4a7090", border: "#1a3354",
};

export const PLATFORMS = [
  { id: "ai_overview", name: "AI Overview", short: "AI Overview", color: S.sky, icon: "G" },
  { id: "ai_mode", name: "AI Mode", short: "AI Mode", color: "#34d399", icon: "M" },
  { id: "chatgpt", name: "ChatGPT", short: "ChatGPT", color: S.green, icon: "⚡" },
  { id: "gemini", name: "Gemini", short: "Gemini", color: S.coral, icon: "◆" },
  { id: "perplexity", name: "Perplexity", short: "Perplexity", color: S.purple, icon: "◈" },
  { id: "copilot", name: "Copilot", short: "Copilot", color: S.gold, icon: "✦" },
];

export function SignalScanner({ data }: { data: any }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0, raf: number;
    
    const resize = () => {
      canvas.width = canvas.offsetWidth || 800;
      canvas.height = 120;
    };
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      ctx.clearRect(0, 0, W, 120); frame++;
      const gap = W / PLATFORMS.length;
      
      // Calculate max volume for scaling
      let maxVol = 1;
      PLATFORMS.forEach(p => {
        const d = data[p.id];
        if (d && d.rows) {
          const total = d.rows.reduce((sum: number, r: any) => sum + (r.volume || 0), 0);
          if (total > maxVol) maxVol = total;
        }
      });

      const nodes = PLATFORMS.map((p, i) => {
        const d = data[p.id];
        const rows = d?.rows || [];
        const totalVol = rows.reduce((sum: number, r: any) => sum + (r.volume || 0), 0);
        const hasData = rows.length > 0;
        const volRatio = hasData ? Math.max(0.3, totalVol / maxVol) : 0.2;
        const baseRadius = 17;
        const radius = hasData ? baseRadius * (0.8 + volRatio * 0.6) : baseRadius * 0.8;
        
        const mentions = rows.filter((r: any) => r.brand_mentioned).length;
        const score = hasData ? Math.round((mentions / rows.length) * 100) : 0;

        return {
          x: gap * i + gap / 2, y: 55, color: hasData ? p.color : S.muted, label: p.short,
          score,
          radius,
          hasData
        };
      });

      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i], b = nodes[i + 1];
        ctx.beginPath(); ctx.moveTo(a.x + a.radius, a.y); ctx.lineTo(b.x - b.radius, b.y);
        ctx.strokeStyle = "#1a335455"; ctx.lineWidth = 1; ctx.stroke();
        
        if (a.hasData || b.hasData) {
          const t = (frame * .016 + i * .2) % 1;
          const px = (a.x + a.radius) + ((b.x - b.radius) - (a.x + a.radius)) * t;
          ctx.beginPath(); ctx.arc(px, a.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = S.green + "cc"; ctx.fill();
        }
      }
      
      nodes.forEach(n => {
        const pulse = n.hasData ? (frame * .022) % 1 : 0;
        if (n.hasData) {
          ctx.beginPath(); ctx.arc(n.x, n.y, n.radius + pulse * 15, 0, Math.PI * 2);
          ctx.strokeStyle = n.color + Math.floor((1 - pulse) * 66).toString(16).padStart(2, "0");
          ctx.lineWidth = 1.5; ctx.stroke();
        }
        
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        g.addColorStop(0, n.color + (n.hasData ? "28" : "11")); 
        g.addColorStop(1, n.color + "04");
        
        ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill(); 
        ctx.strokeStyle = n.color + (n.hasData ? "88" : "33"); 
        ctx.lineWidth = 2; ctx.stroke();
        
        ctx.fillStyle = n.hasData ? n.color : S.muted; 
        ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
        ctx.fillText(n.hasData ? n.score + "%" : "-", n.x, n.y + 4);
        
        ctx.fillStyle = n.hasData ? S.text : S.muted; 
        ctx.font = "9px monospace";
        ctx.fillText(n.label, n.x, n.y + n.radius + 12);
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [data]);
  return <canvas ref={ref} style={{ width: "100%", display: "block" }} />;
}
