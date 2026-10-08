import { useRef, useState } from "react";

type Draw = { reading: Record<string, unknown>; context: { cards: Array<{ card: { id: string; name: string; imageUrls: { original: string } }; orientation: string }> } };

export default function LiveExample({ origin }: { origin: string }) {
  const [result, setResult] = useState<Draw | null>(null);
  const [context, setContext] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const seed = useRef<string | null>(null);
  const [lastPath, setLastPath] = useState("");
  async function run(followUp = false) {
    if (busy) return;
    setBusy(true); setError("");
    if (!seed.current) seed.current = crypto.randomUUID();
    const path = followUp ? "/api/v1/readings/context" : "/api/v1/readings/draw";
    setLastPath(path);
    try {
      const response = await fetch(`${origin}${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(followUp ? { reading: result!.reading, question: "What could I reflect on next?", locale: "en" } : { spread: "THREE", question: "What deserves my attention today?", locale: "en", seed: seed.current }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
      if (followUp) setContext(data);
      else { setResult(data); setContext(null); }
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed. Retry uses the same seed."); }
    finally { setBusy(false); }
  }
  const button = "border px-4 py-2.5 text-[10px] uppercase tracking-[0.3em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30";
  return <div className="mb-8 border border-white/10">
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
      <h3 className="text-[10px] font-light uppercase tracking-[0.3em] text-white/80">Try the real API</h3>
      <span className="text-[10px] tracking-[0.3em] text-neutral-500">在线体验</span>
    </div>
    <div className="p-5 sm:p-6">
      <p className="max-w-[64ch] text-[12px] font-light leading-6 text-neutral-400">This browser calls Franklin directly. Replay keeps the same seed; follow-up uses the returned snapshot.<br /><span className="text-neutral-500">实际请求独立服务，重试保留同一次抽牌。</span></p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={busy} onClick={() => void run()} className={`${button} border-white bg-white text-black hover:bg-white/85`}>{busy ? "Loading…" : result ? "Replay same seed" : error ? "Retry same request" : "Draw three cards"}</button>
        {result && <button disabled={busy} onClick={() => void run(true)} className={`${button} border-white/20 text-neutral-400 hover:border-white/50 hover:text-white`}>Follow up without redrawing</button>}
      </div>
      {error && <p role="alert" className="mt-4 text-[12px] text-red-200">{error}</p>}
      {result && <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6">{result.context.cards.map(({ card, orientation }) => <figure key={card.id} className="min-w-0 text-center"><div className="mx-auto w-full max-w-28 border border-white/15 p-1"><img src={card.imageUrls.original} alt={card.name} className={`w-full ${orientation === "REVERSED" ? "rotate-180" : ""}`} /></div><figcaption className="mt-3"><span className="block font-cinzel text-[10px] uppercase tracking-[0.12em] text-white/80">{card.name}</span><span className="mt-1 block text-[9px] uppercase tracking-[0.24em] text-neutral-500">{orientation}</span></figcaption></figure>)}</div>}
      {lastPath && <p className="mt-6 break-all border-t border-white/10 pt-4 font-mono text-[10px] text-neutral-500" aria-live="polite">POST {origin}{lastPath}{context ? " · Same reading verified" : ""}</p>}
      {result && <details className="group mt-4"><summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.3em] text-neutral-500 transition-colors duration-300 hover:text-white [&::-webkit-details-marker]:hidden">{"+ "}Inspect JSON response</summary><pre className="mt-4 max-h-80 overflow-auto border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-[1.8] text-neutral-300">{JSON.stringify(context || result, null, 2)}</pre></details>}
    </div>
  </div>;
}
