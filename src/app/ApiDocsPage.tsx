import { useState } from "react";
import LiveExample from "./LiveExample";
import { ArrowUpRight, Check, ChevronDown, Copy, Github, Menu, Moon, Sparkles } from "lucide-react";

const API_BASE = "https://tarot-api.songhai.site";

const drawRequest = `// Create and persist the seed before sending if retries must replay this draw.
const seed = crypto.randomUUID();
localStorage.setItem("pending-tarot-seed", seed);

const response = await fetch("${API_BASE}/api/v1/readings/draw", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "What deserves my attention today?",
    spread: "THREE",
    locale: "en",
    seed
  })
});
if (!response.ok) throw new Error((await response.json()).error.message);
const { reading, context } = await response.json();
localStorage.setItem("tarot-reading", JSON.stringify(reading));
// Pass this same reading to /api/v1/readings/context for follow-ups.`;

const drawCurl = `curl -X POST ${API_BASE}/api/v1/readings/draw \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What deserves my attention today?",
    "spread": "THREE",
    "locale": "en",
    "seed": "caller-generated-retry-token"
  }'`;

const drawResponse = `{
  "reading": {
    "readingId": "...",
    "datasetVersion": "...",
    "algorithmVersion": "sha256-counter-v1",
    "seed": "caller-generated-retry-token",
    "spreadId": "THREE",
    "cards": [{ "positionIndex": 1, "cardId": "maj00", "orientation": "UPRIGHT" }]
  },
  "context": {
    "question": "What deserves my attention today?",
    "spread": { "id": "THREE", "cardCount": 3 },
    "cards": [{ "positionLabel": "Past", "selectedMeaning": { "meaning": "..." } }]
  },
  "policy": "Tarot is offered for symbolic reflection..."
}`;

function CodeBlock({ children, label = "" }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.09] bg-[#0b0e0e] shadow-[0_20px_60px_rgba(0,0,0,.18)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
        <span>{label || "request"}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-white/45 transition hover:text-[#e8ba67]" aria-label="Copy code">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-[12px] leading-[1.8] text-[#d5d9d1]"><code>{children}</code></pre>
    </div>
  );
}

function Endpoint({ method, path, description, children }: { method: string; path: string; description: string; children: React.ReactNode }) {
  return (
    <article className="border-t border-black/10 py-8 first:border-t-0 first:pt-0">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold tracking-[0.14em] ${method === "POST" ? "bg-[#c56b4c]/12 text-[#a84f37]" : "bg-[#5c7e72]/13 text-[#476b5e]"}`}>{method}</span>
        <code className="font-mono text-[15px] text-[#222927]">{path}</code>
      </div>
      <p className="mb-6 max-w-[52ch] text-[15px] leading-7 text-[#68706c]">{description}</p>
      {children}
    </article>
  );
}

export default function ApiDocsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = ["Overview", "Quickstart", "Endpoints", "Spreads", "Response"];

  return (
    <div className="api-docs-shell min-h-screen bg-[#f3f3ee] text-[#1e2724] selection:bg-[#e8ba67]/40">
      <div className="pointer-events-none fixed inset-0 opacity-[0.18] [background-image:radial-gradient(#798279_0.7px,transparent_0.7px)] [background-size:22px_22px]" />
      <header className="sticky top-0 z-30 border-b border-black/[0.08] bg-[#f3f3ee]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1320px] items-center justify-between px-5 lg:px-8">
          <a href="#overview" className="flex items-center gap-3 text-[#202825]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#202825] text-[#e8ba67]"><Moon size={16} strokeWidth={1.7} /></span>
            <span className="font-[var(--font-cinzel)] text-[14px] font-semibold tracking-[0.13em]">FRANKLIN / TAROT</span>
            <span className="hidden border-l border-black/15 pl-3 font-mono text-[10px] tracking-[0.14em] text-black/40 sm:block">API DOCS</span>
          </a>
          <nav className="hidden items-center gap-7 text-[12px] font-medium text-[#66706b] lg:flex">
            {nav.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="transition hover:text-[#a84f37]">{item}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <a href="https://github.com/SonghaiFan/franklin-tarot-api" className="hidden items-center gap-2 rounded-full border border-black/10 px-3.5 py-2 text-[12px] text-[#4e5a55] transition hover:border-black/25 hover:text-[#1e2724] sm:flex"><Github size={14} /> GitHub <ArrowUpRight size={12} /></a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full border border-black/10 p-2.5 lg:hidden" aria-label="Toggle navigation"><Menu size={16} /></button>
          </div>
        </div>
        {menuOpen && <nav className="border-t border-black/10 px-5 py-4 lg:hidden">{nav.map((item) => <a onClick={() => setMenuOpen(false)} key={item} href={`#${item.toLowerCase()}`} className="block py-2 text-sm text-[#66706b]">{item}</a>)}</nav>}
      </header>

      <main className="relative mx-auto max-w-[1320px] px-5 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-20 lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-[102px] pt-12">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-black/35">On this page</p>
            <div className="space-y-1 border-l border-black/10 pl-4 text-[13px]">
              {nav.map((item, index) => <a key={item} href={`#${item.toLowerCase()}`} className={`block py-2 transition ${index === 0 ? "font-medium text-[#a84f37]" : "text-[#7b847f] hover:text-[#27312d]"}`}>{item}</a>)}
            </div>
            <div className="mt-12 border-t border-black/10 pt-5 text-[12px] leading-6 text-[#8a918d]">Stateless REST and MCP primitives. Your app or agent keeps the reading snapshot.</div>
          </div>
        </aside>

        <div className="min-w-0 pb-24">
          <section id="overview" className="grid min-h-[530px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#a84f37]/20 bg-[#a84f37]/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a84f37]"><Sparkles size={12} /> REST API · MCP · open source</div>
              <h1 className="max-w-[650px] font-[var(--font-cinzel)] text-[clamp(42px,6vw,78px)] leading-[1.02] tracking-[-0.045em] text-[#202825]">Tarot API<span className="text-[#a84f37]">.</span></h1>
              <p className="mt-7 max-w-[480px] text-[17px] leading-8 text-[#68706c]">A stateless tarot service for apps and AI agents: browse 78 cards, choose from 11 real spreads, make replayable draws, and rebuild verified context for follow-ups.</p>
              <div className="mt-9 flex flex-wrap gap-3"><a href="#quickstart" className="inline-flex items-center gap-2 rounded-full bg-[#202825] px-5 py-3 text-[13px] font-medium text-[#f3f3ee] transition hover:-translate-y-0.5 hover:bg-[#a84f37]">Quickstart <ArrowUpRight size={14} /></a><a href="#endpoints" className="inline-flex items-center gap-2 rounded-full border border-black/15 px-5 py-3 text-[13px] font-medium text-[#46514c] transition hover:border-black/30">API reference</a></div>
            </div>
            <div className="relative mx-auto w-full max-w-[410px] lg:justify-self-end">
              <div className="absolute -inset-8 rounded-full bg-[#e8ba67]/20 blur-3xl" />
              <div className="relative rotate-[4deg] rounded-[18px] border border-[#d9b56b]/50 bg-[#27312d] p-3 shadow-[20px_25px_60px_rgba(32,40,37,.18)]">
                <div className="flex aspect-[.72] flex-col justify-between overflow-hidden rounded-[12px] border border-white/15 bg-[radial-gradient(circle_at_48%_33%,rgba(232,186,103,.25),transparent_18%),linear-gradient(145deg,#32453e,#111715_75%)] p-6 text-[#f4eee2]">
                  <div className="flex justify-between font-mono text-[10px] tracking-[.2em] text-[#e8ba67]/80"><span>THE THREAD</span><span>00</span></div>
                  <div className="text-center"><div className="mx-auto mb-6 h-28 w-28 rounded-full border border-[#e8ba67]/50 p-2"><div className="flex h-full items-center justify-center rounded-full border border-[#e8ba67]/30"><Moon size={42} strokeWidth={1} className="text-[#e8ba67]" /></div></div><p className="font-[var(--font-cinzel)] text-2xl tracking-[.16em]">THE FOOL</p><p className="mt-3 font-mono text-[10px] uppercase tracking-[.2em] text-white/45">begin anywhere</p></div>
                  <div className="flex items-end justify-between"><span className="h-px w-16 bg-[#e8ba67]/50" /><span className="font-mono text-[10px] tracking-[.18em] text-white/35">FRANKLIN / TAROT</span><span className="h-px w-16 bg-[#e8ba67]/50" /></div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 border-y border-black/10 py-8 sm:grid-cols-3">
            {[['78', 'cards in the deck'], ['11', 'supported spreads'], ['2', 'locales · en / zh-CN']].map(([value, label]) => <div key={label} className="flex items-baseline gap-3 px-1"><span className="font-[var(--font-cinzel)] text-3xl text-[#a84f37]">{value}</span><span className="font-mono text-[10px] uppercase tracking-[.13em] text-[#89918c]">{label}</span></div>)}
          </section>

          <section id="quickstart" className="scroll-mt-24 py-24">
            <div className="mb-10 flex items-end justify-between gap-6"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#a84f37]">01 · Quickstart</p><h2 className="font-[var(--font-cinzel)] text-3xl tracking-[-.03em] sm:text-4xl">Your first draw</h2></div><span className="hidden font-mono text-[10px] text-black/35 sm:block">POST /api/v1/readings/draw</span></div>
            <div className="mb-4 rounded-[14px] border border-[#a84f37]/15 bg-[#a84f37]/[0.04] px-5 py-4 text-[13px] leading-6 text-[#68706c]">Public API: <code className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[#303b36]">{API_BASE}</code>. No key required. Pick a spread from <code>/api/v1/spreads</code>. Persist the seed before sending and keep the returned reading snapshot in your own app state.</div>
            <LiveExample origin={API_BASE} />
            <CodeBlock label="javascript · fetch">{drawRequest}</CodeBlock>
            <p className="mt-5 max-w-[62ch] text-[13px] leading-6 text-[#7b847f]">The server never stores a question or reading. The agent or app interprets the structured context; tarot does not establish factual outcomes or probabilities.</p>
            <details className="mt-5"><summary className="cursor-pointer text-[12px] font-medium text-[#a84f37]">Show the equivalent cURL request</summary><div className="mt-4"><CodeBlock label="curl · draw">{drawCurl}</CodeBlock></div></details>
          </section>

          <section id="endpoints" className="scroll-mt-24 py-8"><div className="mb-10"><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#a84f37]">02 · Endpoints</p><h2 className="font-[var(--font-cinzel)] text-3xl tracking-[-.03em] sm:text-4xl">Small surface area.<br />Useful primitives.</h2></div>
            <div className="space-y-0 rounded-[16px] border border-black/10 bg-white/35 px-5 sm:px-8">
              <Endpoint method="GET" path="/health" description="Lightweight service health check."><CodeBlock label="request">{`curl "${API_BASE}/health"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/cards" description="Search by English or Chinese name, keyword, description, or meaning. Supports arcana, suit, locale and pagination filters."><CodeBlock label="request">{`curl "${API_BASE}/api/v1/cards?q=moon&locale=en&limit=10"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/cards/{id}" description="Get full bilingual card data, upright/reversed meanings, provenance notes, and versioned image URLs. Stable IDs such as maj00; legacy numeric IDs remain accepted."><CodeBlock label="request">{`curl "${API_BASE}/api/v1/cards/maj00?locale=en"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/spreads" description="List the 11 supported spreads with card counts, position labels, position card pools, and interpretation goals. AUTO is intentionally excluded."><CodeBlock label="request">{`curl "${API_BASE}/api/v1/spreads?locale=en"`}</CodeBlock></Endpoint>
              <Endpoint method="POST" path="/api/v1/readings/draw" description="Create a seeded reading. Caller picks a real spread and may retain a seed to make retries deterministic."><CodeBlock label="javascript · fetch">{drawRequest}</CodeBlock></Endpoint>
              <Endpoint method="POST" path="/api/v1/readings/context" description="Validate the caller-held snapshot and reconstruct authoritative meanings for a follow-up; never redraws or persists the reading."><CodeBlock label="request">{`fetch("${API_BASE}/api/v1/readings/context", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ reading, question: "And if I wait?", locale: "en" })\n})`}</CodeBlock></Endpoint>
            </div>
          </section>

          <section id="spreads" className="scroll-mt-24 py-24"><div className="mb-10"><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#a84f37]">03 · Agent use</p><h2 className="font-[var(--font-cinzel)] text-3xl tracking-[-.03em] sm:text-4xl">REST or MCP.</h2></div><p className="mb-6 max-w-[70ch] text-[14px] leading-7 text-[#68706c]">Try the user-facing <a className="underline" href="https://tarot.songhai.site">Frankie Tarot app</a>, or build your own interface. The API repository exposes a UI-free Agent MCP at <code>/mcp/agent</code>. Its tools are <code>search_tarot_cards</code>, <code>get_tarot_card</code>, <code>list_tarot_spreads</code>, <code>draw_tarot_reading</code>, and <code>get_tarot_reading_context</code>. Ask the agent to list spreads before drawing; it should retain the returned reading snapshot and call the context tool for follow-ups.</p><div className="grid gap-4 sm:grid-cols-2"><CodeBlock label="MCP · endpoint">{`${API_BASE}/mcp/agent`}</CodeBlock><CodeBlock label="OpenAPI">{`${API_BASE}/openapi.json`}</CodeBlock></div><p className="mt-6 text-[13px] leading-6 text-[#7b847f]">Web and plugin interfaces are separate example applications. The browser calls REST for user-triggered draws; the plugin host adapter can call Agent MCP for spread and follow-up context.</p></section>

          <section id="response" className="scroll-mt-24 border-t border-black/10 py-24"><div className="mb-10 flex items-end justify-between gap-6"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-[#a84f37]">04 · Response</p><h2 className="font-[var(--font-cinzel)] text-3xl tracking-[-.03em] sm:text-4xl">Predictable by design.</h2></div><ChevronDown size={20} className="mb-1 text-black/25" /></div><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><p className="text-[15px] leading-7 text-[#68706c]">A draw returns an immutable replay snapshot and structured context. Your app or agent controls interpretation and retains only the snapshot it needs.</p><div className="mt-8 space-y-4 text-[13px] text-[#65706a]"><div className="flex gap-3"><span className="mt-1 text-[#a84f37]">—</span><span><code>reading.seed</code>, dataset version, and algorithm version support deterministic replay.</span></div><div className="flex gap-3"><span className="mt-1 text-[#a84f37]">—</span><span><code>context.cards[].selectedMeaning</code> follows each card's orientation.</span></div><div className="flex gap-3"><span className="mt-1 text-[#a84f37]">—</span><span>Structured errors include stable codes; questions and readings are not stored.</span></div></div><p className="mt-8"><a className="inline-flex items-center gap-2 text-[13px] text-[#a84f37]" href={`${import.meta.env.BASE_URL}openapi.json`}>Download OpenAPI schema <ArrowUpRight size={13}/></a></p></div><CodeBlock label="200 · application/json">{drawResponse}</CodeBlock></div></section>

          <footer className="flex flex-col gap-5 border-t border-black/10 pt-7 text-[11px] text-[#89918c] sm:flex-row sm:items-center sm:justify-between"><span>FRANKLIN / TAROT · MIT LICENSE</span><span>For reflection, not prediction.</span><a className="flex items-center gap-1 transition hover:text-[#a84f37]" href="https://github.com/SonghaiFan/franklin-tarot-api">View source <ArrowUpRight size={12} /></a></footer>
        </div>
      </main>
    </div>
  );
}
