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
  return <div className="mb-6 rounded-[14px] border border-black/10 bg-white/60 p-5">
    <h3 className="text-base font-semibold">Try the real API · 在线体验</h3>
    <p className="mt-2 text-sm leading-6 text-[#68706c]">This browser calls Franklin directly. Replay keeps the same seed; follow-up uses the returned snapshot. 实际请求独立服务，重试保留同一次抽牌。</p>
    <div className="my-4 flex flex-wrap gap-3">
      <button disabled={busy} onClick={() => void run()} className="rounded-full bg-[#202825] px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "Loading…" : result ? "Replay same seed" : error ? "Retry same request" : "Draw three cards"}</button>
      {result && <button disabled={busy} onClick={() => void run(true)} className="rounded-full border border-black/20 px-4 py-2 text-sm disabled:opacity-50">Follow up without redrawing</button>}
    </div>
    {error && <p role="alert" className="my-3 text-sm text-red-800">{error}</p>}
    {result && <div className="grid grid-cols-3 gap-3">{result.context.cards.map(({ card, orientation }) => <figure key={card.id} className="min-w-0 text-center"><img src={card.imageUrls.original} alt={card.name} className={`mx-auto w-full max-w-28 rounded-sm ${orientation === "REVERSED" ? "rotate-180" : ""}`} /><figcaption className="mt-3 text-xs leading-5">{card.name}<br />{orientation}</figcaption></figure>)}</div>}
    {lastPath && <p className="mt-4 break-all font-mono text-xs text-[#68706c]" aria-live="polite">POST {origin}{lastPath}{context ? " · Same reading verified" : ""}</p>}
    {result && <details className="mt-3 text-sm"><summary className="cursor-pointer">Inspect JSON response</summary><pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-[#0b0e0e] p-4 text-xs text-white">{JSON.stringify(context || result, null, 2)}</pre></details>}
  </div>;
}
