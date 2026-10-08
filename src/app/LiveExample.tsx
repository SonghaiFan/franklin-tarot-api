import { useRef, useState } from "react";
import TarotCard, { romanNumeralFor } from "./TarotCard";
import type { Locale } from "./copy";

type Draw = { reading: Record<string, unknown>; context: { cards: Array<{ card: { id: string; name: string; imageUrls: { redraw: string; original: string } }; orientation: string }> } };

export default function LiveExample({ origin, locale }: { origin: string; locale: Locale }) {
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
        body: JSON.stringify(followUp ? { reading: result!.reading, question: locale === "zh-CN" ? "接下来我可以反思什么？" : "What could I reflect on next?", locale } : { spread: "THREE", question: locale === "zh-CN" ? "今天有什么值得我关注？" : "What deserves my attention today?", locale, seed: seed.current }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
      if (followUp) setContext(data);
      else { setResult(data); setContext(null); }
    } catch (e) { setError(e instanceof Error ? e.message : (locale === "zh-CN" ? "请求失败，重试会复用同一个 seed。" : "Request failed. Retry uses the same seed.")); }
    finally { setBusy(false); }
  }
  const button = "border px-4 py-2.5 text-[13px] tracking-[0.12em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30";
  return <div className="mb-8 border border-white/10">
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
      <h3 className="text-[14px] font-light tracking-[0.12em] text-white/90">{locale === "zh-CN" ? "在线体验真实 API" : "Try the real API"}</h3>
      <span className="text-[12px] tracking-wide text-neutral-400">{locale === "zh-CN" ? "在线体验" : "LIVE EXAMPLE"}</span>
    </div>
    <div className="p-5 sm:p-6">
      <p className="max-w-[64ch] text-[15px] font-light leading-7 text-neutral-300">{locale === "zh-CN" ? "浏览器直接请求 Franklin 服务。重放会复用同一个 seed；后续追问会使用返回的牌局快照。" : "This browser calls Franklin directly. Replay keeps the same seed; follow-up uses the returned snapshot."}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={busy} onClick={() => void run()} className={`${button} border-white bg-white text-black hover:bg-white/85`}>{busy ? (locale === "zh-CN" ? "请求中…" : "Loading…") : result ? (locale === "zh-CN" ? "用相同 seed 重放" : "Replay same seed") : error ? (locale === "zh-CN" ? "重试同一请求" : "Retry same request") : (locale === "zh-CN" ? "抽取三张牌" : "Draw three cards")}</button>
        {result && <button disabled={busy} onClick={() => void run(true)} className={`${button} border-white/20 text-neutral-400 hover:border-white/50 hover:text-white`}>{locale === "zh-CN" ? "沿用牌局继续追问" : "Follow up without redrawing"}</button>}
      </div>
      {error && <p role="alert" className="mt-4 text-[12px] text-red-200">{error}</p>}
      {result && <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6">{result.context.cards.map(({ card, orientation }) => <figure key={card.id} className="mx-auto w-full max-w-36 min-w-0"><TarotCard side="face" image={card.imageUrls.redraw} name={card.name} numeral={romanNumeralFor(card.id)} reversed={orientation === "REVERSED"} /></figure>)}</div>}
      {lastPath && <p className="mt-6 break-all border-t border-white/10 pt-4 font-mono text-[12px] text-neutral-400" aria-live="polite">POST {origin}{lastPath}{context ? (locale === "zh-CN" ? " · 已校验同一牌局" : " · Same reading verified") : ""}</p>}
      {result && <details className="group mt-4"><summary className="cursor-pointer list-none text-[13px] tracking-wide text-neutral-400 transition-colors duration-300 hover:text-white [&::-webkit-details-marker]:hidden">{locale === "zh-CN" ? "+ 查看 JSON 响应" : "+ Inspect JSON response"}</summary><pre className="mt-4 max-h-80 overflow-auto border border-white/10 bg-black/40 p-4 font-mono text-[12px] leading-[1.8] text-neutral-300">{JSON.stringify(context || result, null, 2)}</pre></details>}
    </div>
  </div>;
}
