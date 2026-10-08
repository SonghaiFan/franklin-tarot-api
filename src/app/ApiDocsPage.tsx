import { useEffect, useState } from "react";
import LiveExample from "./LiveExample";
import SpreadLayout, { type Spread } from "./SpreadLayout";
import { ArrowUpRight, Check, ChevronDown, Copy, Github, Menu, Moon, X } from "lucide-react";

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

const NAV = ["Overview", "Quickstart", "Endpoints", "Spreads", "Response"];

/** The app's small tracked caps: section eyebrows, list headers, metadata. */
function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[10px] font-light uppercase tracking-[0.3em] text-neutral-500 ${className}`}>{children}</p>;
}

function SectionHead({ index, eyebrow, title, children }: { index: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-12">
      <Eyebrow>{index} · {eyebrow}</Eyebrow>
      <h2 className="mt-5 font-cinzel text-lg uppercase tracking-[0.28em] text-white/85 sm:text-xl">{title}</h2>
      <div className="mt-6 h-px w-8 bg-white/40" />
      {children && <p className="mt-6 max-w-[62ch] text-[13px] font-light leading-7 text-neutral-400">{children}</p>}
    </div>
  );
}

function CodeBlock({ children, label = "" }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="min-w-0 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[9px] font-light uppercase tracking-[0.3em] text-neutral-500">
        <span>{label || "request"}</span>
        <button onClick={copy} className="flex items-center gap-1.5 uppercase tracking-[0.3em] text-neutral-500 transition-colors duration-300 hover:text-white" aria-label="Copy code">
          {copied ? <Check size={11} strokeWidth={1.5} /> : <Copy size={11} strokeWidth={1.5} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[11.5px] leading-[1.85] text-neutral-300"><code>{children}</code></pre>
    </div>
  );
}

function Method({ method }: { method: string }) {
  return (
    <span className={`inline-block w-12 border py-1 text-center font-mono text-[9px] tracking-[0.2em] ${method === "POST" ? "border-white/60 text-white" : "border-white/15 text-neutral-400"}`}>
      {method}
    </span>
  );
}

function Endpoint({ method, path, description, children }: { method: string; path: string; description: string; children: React.ReactNode }) {
  return (
    <article className="border-t border-white/10 py-10 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Method method={method} />
        <code className="font-mono text-[13px] tracking-wide text-white/90">{path}</code>
      </div>
      <p className="mb-6 max-w-[56ch] text-[13px] font-light leading-7 text-neutral-400">{description}</p>
      {children}
    </article>
  );
}

function Disclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group mt-6">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-500 transition-colors duration-300 hover:text-white [&::-webkit-details-marker]:hidden">
        <ChevronDown size={12} strokeWidth={1.5} className="transition-transform duration-300 group-open:rotate-180" />
        {summary}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

/** Two square cards fanned like the deck library's pack tiles, drawn in hairlines. */
function HeroCards() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[240px] sm:max-w-[360px] lg:justify-self-end">
      <div className="absolute left-[6%] top-[8%] aspect-[0.6] w-[52%] -rotate-8 border border-white/15 bg-[#07070c] p-2">
        <div className="h-full w-full border border-white/[0.06] [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.05)_0_1px,transparent_1px_9px)]" />
      </div>
      <div className="absolute right-[6%] top-0 aspect-[0.6] w-[52%] rotate-6 border border-white/40 bg-[#07070c] p-2 shadow-[0_30px_80px_rgba(0,0,0,.6)]">
        <div className="flex h-full w-full flex-col justify-between border border-white/10 p-4">
          <div className="flex justify-between text-[8px] font-light tracking-[0.3em] text-white/50"><span>0</span><span>0</span></div>
          <div className="text-center">
            <div className="mx-auto mb-5 grid size-16 place-items-center border border-white/25">
              <Moon size={26} strokeWidth={0.75} className="text-white/80" />
            </div>
            <p className="font-cinzel text-[13px] tracking-[0.28em] text-white/90">THE FOOL</p>
            <div className="mx-auto mt-3 h-px w-6 bg-white/30" />
          </div>
          <p className="text-center text-[7px] font-light tracking-[0.42em] text-white/35">FRANKLIN</p>
        </div>
      </div>
    </div>
  );
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const SECTION_IDS = NAV.map((item) => item.toLowerCase());

export default function ApiDocsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [spreads, setSpreads] = useState<Spread[] | null>(null);
  const [spreadError, setSpreadError] = useState(false);
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const origin = import.meta.env.DEV ? API_BASE : window.location.origin;
    let isMounted = true;
    fetch(`${origin}/api/v1/spreads?locale=en`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load spread layouts.");
        return response.json();
      })
      .then((data: { spreads?: Spread[] }) => {
        if (!Array.isArray(data.spreads)) throw new Error("Spread layout data is invalid.");
        if (isMounted) setSpreads(data.spreads);
      })
      .catch(() => { if (isMounted) setSpreadError(true); });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="api-docs-shell min-h-screen bg-[#030308] text-neutral-200 selection:bg-white/20">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#030308]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <a href="#overview" className="flex items-center gap-4 text-white/90">
            <img src="/franklin.svg" alt="Franklin" className="h-6 w-[84px] object-contain brightness-0 invert opacity-90" />
            <span className="hidden border-l border-white/15 pl-4 text-[9px] font-light tracking-[0.42em] text-white/40 sm:block">API</span>
          </a>
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className={`text-[10px] font-light uppercase tracking-[0.3em] transition-colors duration-300 ${active === item.toLowerCase() ? "text-white" : "text-white/40 hover:text-white/80"}`}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="https://github.com/SonghaiFan/franklin-tarot-api" className="hidden items-center gap-2 border border-white/15 px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400 transition-colors duration-300 hover:border-white/40 hover:text-white sm:flex"><Github size={13} strokeWidth={1.25} /> GitHub</a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-9 place-items-center border border-white/15 text-white/70 lg:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>
              {menuOpen ? <X size={15} strokeWidth={1.25} /> : <Menu size={15} strokeWidth={1.25} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/10 px-5 py-2 lg:hidden">
            {NAV.map((item) => <a onClick={() => setMenuOpen(false)} key={item} href={`#${item.toLowerCase()}`} className="block border-b border-white/5 py-3.5 text-[10px] uppercase tracking-[0.3em] text-white/60 last:border-b-0">{item}</a>)}
          </nav>
        )}
      </header>

      <main className="relative mx-auto max-w-[1240px] px-5 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-20 lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-16 pt-16">
            <Eyebrow className="mb-6">On this page</Eyebrow>
            <ol className="border-l border-white/10">
              {NAV.map((item, index) => {
                const isActive = active === item.toLowerCase();
                return (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className={`-ml-px flex items-baseline gap-3 border-l py-2.5 pl-4 text-[11px] tracking-[0.16em] transition-colors duration-300 ${isActive ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/75"}`}>
                      <span className="font-mono text-[9px] text-white/30">0{index + 1}</span>{item}
                    </a>
                  </li>
                );
              })}
            </ol>
            <p className="mt-12 border-t border-white/10 pt-6 text-[11px] font-light leading-6 text-neutral-500">Stateless REST and MCP primitives. Your app or agent keeps the reading snapshot.</p>
          </div>
        </aside>

        <div className="min-w-0 pb-24">
          <section id="overview" className="grid scroll-mt-16 items-center gap-16 py-20 lg:min-h-[560px] lg:grid-cols-[1.1fr_.9fr] lg:py-28">
            <div>
              <Eyebrow>REST API · MCP · Open source</Eyebrow>
              <h1 className="mt-8 text-[clamp(30px,4.6vw,52px)] font-light leading-[1.15] tracking-[0.42em] text-white">TAROT<br />API</h1>
              <div className="mt-8 h-px w-8 bg-white/40" />
              <p className="mt-8 max-w-[440px] text-[14px] font-light leading-8 text-neutral-400">A stateless tarot service for apps and AI agents: browse 78 cards, choose from 11 real spreads, make replayable draws, and rebuild verified context for follow-ups.</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href="#quickstart" className="inline-flex items-center gap-2 border border-white bg-white px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-black transition-colors duration-300 hover:bg-white/85">Quickstart <ArrowUpRight size={12} strokeWidth={1.5} /></a>
                <a href="#endpoints" className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-neutral-400 transition-colors duration-300 hover:border-white/50 hover:text-white">Reference</a>
              </div>
            </div>
            <HeroCards />
          </section>

          <section className="grid grid-cols-3 border border-white/10">
            {[["78", "Cards"], ["11", "Spreads"], ["2", "Locales"]].map(([value, label]) => (
              <div key={label} className="border-l border-white/10 px-4 py-7 text-center first:border-l-0 sm:px-6">
                <p className="font-cinzel text-2xl font-normal text-white/90 sm:text-3xl">{value}</p>
                <p className="mt-3 text-[9px] font-light uppercase tracking-[0.3em] text-neutral-500">{label}</p>
              </div>
            ))}
          </section>

          <section id="quickstart" className="scroll-mt-16 py-28">
            <SectionHead index="01" eyebrow="Quickstart" title="Your first draw" />
            <dl className="mb-8 grid border border-white/10 sm:grid-cols-[140px_1fr]">
              {[
                ["Base URL", <code key="u" className="break-all font-mono text-white/85">{API_BASE}</code>],
                ["Auth", "None. No key required."],
                ["Spreads", <span key="s">Pick one from <code className="font-mono text-white/75">/api/v1/spreads</code>.</span>],
                ["State", "Persist the seed before sending and keep the returned reading snapshot in your own app."],
              ].map(([term, detail], index) => (
                <div key={index} className="contents">
                  <dt className={`px-5 pt-4 text-[9px] uppercase tracking-[0.3em] text-neutral-500 sm:py-4 ${index ? "border-t border-white/10" : ""}`}>{term}</dt>
                  <dd className={`px-5 pb-4 pt-1.5 text-[12px] font-light leading-6 text-neutral-400 sm:py-4 ${index ? "sm:border-t sm:border-white/10" : ""}`}>{detail}</dd>
                </div>
              ))}
            </dl>
            <LiveExample origin={import.meta.env.DEV ? API_BASE : window.location.origin} />
            <CodeBlock label="javascript · fetch">{drawRequest}</CodeBlock>
            <p className="mt-6 max-w-[62ch] text-[12px] font-light leading-6 text-neutral-500">The server never stores a question or reading. The agent or app interprets the structured context; tarot does not establish factual outcomes or probabilities.</p>
            <Disclosure summary="Equivalent cURL request"><CodeBlock label="curl · draw">{drawCurl}</CodeBlock></Disclosure>
          </section>

          <section id="endpoints" className="scroll-mt-16 border-t border-white/10 py-28">
            <SectionHead index="02" eyebrow="Endpoints" title="Six primitives" />
            <div>
              <Endpoint method="GET" path="/health" description="Lightweight service health check."><CodeBlock label="request">{`curl "${API_BASE}/health"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/cards" description="Search by English or Chinese name, keyword, description, or meaning. Supports arcana, suit, locale and pagination filters."><CodeBlock label="request">{`curl "${API_BASE}/api/v1/cards?q=moon&locale=en&limit=10"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/cards/{id}" description="Get full bilingual card data, upright/reversed meanings, provenance notes, and versioned image URLs. Use stable card IDs such as maj00."><CodeBlock label="request">{`curl "${API_BASE}/api/v1/cards/maj00?locale=en"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/spreads" description="List the 11 supported spreads with relative card positions, localized labels, position card pools, and interpretation goals. AUTO is intentionally excluded."><CodeBlock label="request">{`curl "${API_BASE}/api/v1/spreads?locale=en"`}</CodeBlock></Endpoint>
              <Endpoint method="POST" path="/api/v1/readings/draw" description="Create a seeded reading. Caller picks a real spread and may retain a seed to make retries deterministic."><CodeBlock label="javascript · fetch">{drawRequest}</CodeBlock></Endpoint>
              <Endpoint method="POST" path="/api/v1/readings/context" description="Validate the caller-held snapshot and reconstruct authoritative meanings for a follow-up; never redraws or persists the reading."><CodeBlock label="request">{`fetch("${API_BASE}/api/v1/readings/context", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ reading, question: "And if I wait?", locale: "en" })\n})`}</CodeBlock></Endpoint>
            </div>
          </section>

          <section id="spreads" className="scroll-mt-16 border-t border-white/10 py-28">
            <SectionHead index="03" eyebrow="Spread layouts" title="See the spread">
              Each diagram uses the same relative card positions as the Frankie app. Numbers show draw order; the list below each layout names what every position represents.
            </SectionHead>
            {spreads && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3 xl:gap-4">{spreads.map((spread) => <SpreadLayout key={spread.id} spread={spread} />)}</div>}
            {!spreads && <p role="status" className="border border-white/10 px-5 py-6 text-center text-[10px] uppercase tracking-[0.3em] text-neutral-500">{spreadError ? "Spread layouts could not be loaded. Try refreshing." : "Loading spread layouts…"}</p>}
            <p className="mt-6 text-[12px] font-light leading-6 text-neutral-500">Positions and localized labels come from <code className="font-mono text-white/70">GET /api/v1/spreads</code>; use the returned spread ID when creating a reading.</p>

            <div className="mt-28 border-t border-white/10 pt-28">
              <SectionHead index="04" eyebrow="Agent use" title="REST or MCP" />
              <p className="mb-8 max-w-[68ch] text-[13px] font-light leading-7 text-neutral-400">Try the user-facing <a className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white" href="https://tarot.songhai.site">Frankie Tarot app</a>, or build your own interface. The API repository exposes a UI-free Agent MCP at <code className="font-mono text-white/75">/mcp/agent</code>. Ask the agent to list spreads before drawing; it should retain the returned reading snapshot and call the context tool for follow-ups.</p>
              <Eyebrow className="mb-3">Tools</Eyebrow>
              <ul className="mb-10 border-t border-white/10">
                {["search_tarot_cards", "get_tarot_card", "list_tarot_spreads", "draw_tarot_reading", "get_tarot_reading_context"].map((tool, index) => (
                  <li key={tool} className="flex items-baseline gap-4 border-b border-white/10 py-3">
                    <span className="font-mono text-[9px] text-white/30">0{index + 1}</span>
                    <code className="font-mono text-[12px] text-white/80">{tool}</code>
                  </li>
                ))}
              </ul>
              <div className="grid gap-3 sm:grid-cols-2"><CodeBlock label="MCP · endpoint">{`${API_BASE}/mcp/agent`}</CodeBlock><CodeBlock label="OpenAPI">{`${API_BASE}/openapi.json`}</CodeBlock></div>
              <p className="mt-6 max-w-[68ch] text-[12px] font-light leading-6 text-neutral-500">Web and plugin interfaces are separate example applications. The browser calls REST for user-triggered draws; the plugin host adapter can call Agent MCP for spread and follow-up context.</p>
            </div>
          </section>

          <section id="response" className="scroll-mt-16 border-t border-white/10 py-28">
            <SectionHead index="05" eyebrow="Response" title="Predictable by design" />
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-[13px] font-light leading-7 text-neutral-400">A draw returns an immutable replay snapshot and structured context. Your app or agent controls interpretation and retains only the snapshot it needs.</p>
                <ul className="mt-8 border-t border-white/10 text-[12px] font-light leading-6 text-neutral-400">
                  {[
                    <><code className="font-mono text-white/75">reading.seed</code>, dataset version, and algorithm version support deterministic replay.</>,
                    <><code className="font-mono text-white/75">context.cards[].selectedMeaning</code> follows each card's orientation.</>,
                    <>Structured errors include stable codes; questions and readings are not stored.</>,
                  ].map((item, index) => (
                    <li key={index} className="flex gap-4 border-b border-white/10 py-4"><span className="mt-3 h-px w-4 shrink-0 bg-white/30" /><span>{item}</span></li>
                  ))}
                </ul>
                <a className="mt-8 inline-flex items-center gap-2 border border-white/20 px-4 py-2.5 text-[10px] uppercase tracking-[0.3em] text-neutral-400 transition-colors duration-300 hover:border-white/50 hover:text-white" href={`${import.meta.env.BASE_URL}openapi.json`}>OpenAPI schema <ArrowUpRight size={12} strokeWidth={1.5} /></a>
              </div>
              <CodeBlock label="200 · application/json">{drawResponse}</CodeBlock>
            </div>
          </section>

          <footer className="flex flex-col gap-4 border-t border-white/10 pt-8 text-[9px] font-light uppercase tracking-[0.3em] text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Franklin · MIT License</span>
            <span>For reflection, not prediction</span>
            <a className="inline-flex items-center gap-1.5 transition-colors duration-300 hover:text-white" href="https://github.com/SonghaiFan/franklin-tarot-api">Source <ArrowUpRight size={11} strokeWidth={1.5} /></a>
          </footer>
        </div>
      </main>
    </div>
  );
}
