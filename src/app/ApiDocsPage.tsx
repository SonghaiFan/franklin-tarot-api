import { useEffect, useState } from "react";
import LiveExample from "./LiveExample";
import SpreadLayout, { type Spread } from "./SpreadLayout";
import TarotCard from "./TarotCard";
import { ArrowUpRight, Check, ChevronDown, Copy, Github, Menu, X } from "lucide-react";
import { COPY, type Locale } from "./copy";

const API_BASE = "https://tarot-api.songhai.site";

const drawRequest = (locale: Locale) => `// Create and persist the seed before sending if retries must replay this draw.
const seed = crypto.randomUUID();
localStorage.setItem("pending-tarot-seed", seed);

const response = await fetch("${API_BASE}/api/v1/readings/draw", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    question: "${locale === "zh-CN" ? "今天有什么值得我关注？" : "What deserves my attention today?"}",
    spread: "THREE",
    locale: "${locale}",
    seed
  })
});
if (!response.ok) throw new Error((await response.json()).error.message);
const { reading, context } = await response.json();
localStorage.setItem("tarot-reading", JSON.stringify(reading));
// Pass this same reading to /api/v1/readings/context for follow-ups.`;

const drawCurl = (locale: Locale) => `curl -X POST ${API_BASE}/api/v1/readings/draw \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "${locale === "zh-CN" ? "今天有什么值得我关注？" : "What deserves my attention today?"}",
    "spread": "THREE",
    "locale": "${locale}",
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

// In dev the page talks to the deployed API, which also serves the card images.
const API_ORIGIN = import.meta.env.DEV ? API_BASE : window.location.origin;

const SECTION_IDS = ["overview", "quickstart", "endpoints", "spreads", "response"];

/** The app's small tracked caps: section eyebrows, list headers, metadata. */
function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[12px] font-light uppercase tracking-[0.2em] text-neutral-500 ${className}`}>{children}</p>;
}

function SectionHead({ index, eyebrow, title, children }: { index: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-12">
      <Eyebrow>{index} · {eyebrow}</Eyebrow>
      <h2 className="mt-5 font-cinzel text-xl uppercase tracking-[0.18em] text-white/85 sm:text-2xl">{title}</h2>
      <div className="mt-6 h-px w-8 bg-white/40" />
      {children && <p className="mt-6 max-w-[62ch] text-[15px] font-light leading-7 text-neutral-400">{children}</p>}
    </div>
  );
}

function CodeBlock({ children, label = "", locale = "en" }: { children: string; label?: string; locale?: Locale }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="min-w-0 border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[12px] font-light uppercase tracking-[0.15em] text-neutral-500">
        <span>{label || "request"}</span>
        <button onClick={copy} className="flex items-center gap-1.5 uppercase tracking-[0.15em] text-neutral-500 transition-colors duration-300 hover:text-white" aria-label="Copy code">
          {copied ? <Check size={11} strokeWidth={1.5} /> : <Copy size={11} strokeWidth={1.5} />}
          {copied ? COPY[locale].copied : COPY[locale].copy}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-[1.8] text-neutral-300"><code>{children}</code></pre>
    </div>
  );
}

function Method({ method }: { method: string }) {
  return (
    <span className={`inline-block w-14 border py-1 text-center font-mono text-[11px] tracking-[0.12em] ${method === "POST" ? "border-white/60 text-white" : "border-white/15 text-neutral-400"}`}>
      {method}
    </span>
  );
}

function Endpoint({ method, path, description, children }: { method: string; path: string; description: string; children: React.ReactNode }) {
  return (
    <article className="border-t border-white/10 py-10 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Method method={method} />
        <code className="font-mono text-[15px] tracking-wide text-white/90">{path}</code>
      </div>
      <p className="mb-6 max-w-[56ch] text-[15px] font-light leading-7 text-neutral-400">{description}</p>
      {children}
    </article>
  );
}

function Disclosure({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group mt-6">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[13px] uppercase tracking-[0.12em] text-neutral-500 transition-colors duration-300 hover:text-white [&::-webkit-details-marker]:hidden">
        <ChevronDown size={12} strokeWidth={1.5} className="transition-transform duration-300 group-open:rotate-180" />
        {summary}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

/** A back and a face fanned the way the app's deck library previews a pack. */
function HeroCards() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[260px] sm:max-w-[380px] lg:justify-self-end">
      <div className="absolute left-[6.25%] top-[6.25%] w-[48%] -rotate-8">
        <TarotCard side="back" />
      </div>
      <div className="absolute right-[8.33%] top-0 w-[48%] rotate-6">
        <TarotCard side="face" image={`${API_ORIGIN}/images/cards/maj00.webp`} name="The Fool" numeral="0" />
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

export default function ApiDocsPage() {
  const [locale, setLocale] = useState<Locale>(() => {
    try { return localStorage.getItem("franklin-docs-locale") === "zh-CN" ? "zh-CN" : "en"; }
    catch { return "en"; }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [spreads, setSpreads] = useState<Spread[] | null>(null);
  const [spreadError, setSpreadError] = useState(false);
  const active = useActiveSection(SECTION_IDS);
  const copy = COPY[locale];

  useEffect(() => {
    let isMounted = true;
    setSpreads(null);
    setSpreadError(false);
    fetch(`${API_ORIGIN}/api/v1/spreads?locale=${locale}`)
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
  }, [locale]);

  const changeLocale = (next: Locale) => {
    setLocale(next);
    try { localStorage.setItem("franklin-docs-locale", next); } catch { /* Language toggle still works when storage is blocked. */ }
  };

  return (
    <div className="api-docs-shell min-h-screen bg-[#030308] text-neutral-200 selection:bg-white/20">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#030308]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <a href="#overview" className="flex items-center gap-4 text-white/90">
            <img src="/franklin.svg" alt="Franklin" className="h-6 w-[84px] object-contain brightness-0 invert opacity-90" />
            <span className="hidden border-l border-white/15 pl-4 text-[9px] font-light tracking-[0.42em] text-white/40 sm:block">API</span>
          </a>
          <nav className="hidden items-center gap-8 lg:flex">
            {copy.nav.map((item, index) => (
              <a key={SECTION_IDS[index]} href={`#${SECTION_IDS[index]}`} className={`text-[12px] font-light tracking-[0.12em] transition-colors duration-300 ${active === SECTION_IDS[index] ? "text-white" : "text-white/40 hover:text-white/80"}`}>{item}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => changeLocale(locale === "en" ? "zh-CN" : "en")} className="border border-white/15 px-3.5 py-2 text-[12px] tracking-wide text-neutral-300 transition-colors duration-300 hover:border-white/40 hover:text-white" aria-label={locale === "en" ? "切换到简体中文" : "Switch to English"}>{locale === "en" ? "中文" : "EN"}</button>
            <a href="https://github.com/SonghaiFan/franklin-tarot-api" className="hidden items-center gap-2 border border-white/15 px-3.5 py-2 text-[12px] uppercase tracking-[0.12em] text-neutral-400 transition-colors duration-300 hover:border-white/40 hover:text-white sm:flex"><Github size={14} strokeWidth={1.25} /> GitHub</a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-9 place-items-center border border-white/15 text-white/70 lg:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>
              {menuOpen ? <X size={15} strokeWidth={1.25} /> : <Menu size={15} strokeWidth={1.25} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/10 px-5 py-2 lg:hidden">
            {copy.nav.map((item, index) => <a onClick={() => setMenuOpen(false)} key={SECTION_IDS[index]} href={`#${SECTION_IDS[index]}`} className="block border-b border-white/5 py-3.5 text-[13px] tracking-[0.12em] text-white/60 last:border-b-0">{item}</a>)}
          </nav>
        )}
      </header>

      <main className="relative mx-auto max-w-[1240px] px-5 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-20 lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-16 pt-16">
            <Eyebrow className="mb-6">{copy.onPage}</Eyebrow>
            <ol className="border-l border-white/10">
              {copy.nav.map((item, index) => {
                const isActive = active === SECTION_IDS[index];
                return (
                  <li key={SECTION_IDS[index]}>
                    <a href={`#${SECTION_IDS[index]}`} className={`-ml-px flex items-baseline gap-3 border-l py-2.5 pl-4 text-[13px] tracking-[0.08em] transition-colors duration-300 ${isActive ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/75"}`}>
                      <span className="font-mono text-[11px] text-white/30">0{index + 1}</span>{item}
                    </a>
                  </li>
                );
              })}
            </ol>
            <p className="mt-12 border-t border-white/10 pt-6 text-[14px] font-light leading-7 text-neutral-500">{copy.asideNote}</p>
          </div>
        </aside>

        <div className="min-w-0 pb-24">
          <section id="overview" className="grid scroll-mt-16 items-center gap-16 py-20 lg:min-h-[560px] lg:grid-cols-[1.1fr_.9fr] lg:py-28">
            <div>
              <Eyebrow>{copy.heroEyebrow}</Eyebrow>
              <h1 className="mt-8 text-[clamp(36px,5vw,60px)] font-light leading-[1.15] tracking-[0.32em] text-white">TAROT<br />API</h1>
              <div className="mt-8 h-px w-8 bg-white/40" />
              <p className="mt-8 max-w-[500px] text-[17px] font-light leading-8 text-neutral-300">{copy.heroDescription}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <a href="#quickstart" className="inline-flex items-center gap-2 border border-white bg-white px-5 py-3 text-[13px] tracking-[0.12em] text-black transition-colors duration-300 hover:bg-white/85">{copy.quickstart} <ArrowUpRight size={14} strokeWidth={1.5} /></a>
                <a href="#endpoints" className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-[13px] tracking-[0.1em] text-neutral-300 transition-colors duration-300 hover:border-white/50 hover:text-white">{copy.reference}</a>
              </div>
            </div>
            <HeroCards />
          </section>

          <section className="grid grid-cols-3 border border-white/10">
            {[["78", copy.stats[0]], ["11", copy.stats[1]], ["2", copy.stats[2]]].map(([value, label]) => (
              <div key={label} className="border-l border-white/10 px-4 py-7 text-center first:border-l-0 sm:px-6">
                <p className="font-cinzel text-2xl font-normal text-white/90 sm:text-3xl">{value}</p>
                <p className="mt-3 text-[12px] font-light tracking-[0.16em] text-neutral-400">{label}</p>
              </div>
            ))}
          </section>

          <section id="quickstart" className="scroll-mt-16 py-28">
            <SectionHead index="01" eyebrow={copy.quickstart} title={copy.firstDraw}>{copy.quickDescription}</SectionHead>
            <dl className="mb-8 grid border border-white/10 sm:grid-cols-[140px_1fr]">
              {[
                [copy.quickFields[0], <code key="u" className="break-all font-mono text-white/85">{API_BASE}</code>],
                [copy.quickFields[1], copy.auth],
                [copy.quickFields[2], <span key="s">{copy.spreadChoice} <code className="font-mono text-white/75">/api/v1/spreads</code>.</span>],
                [copy.quickFields[3], copy.state],
              ].map(([term, detail], index) => (
                <div key={index} className="contents">
                  <dt className={`px-5 pt-4 text-[12px] uppercase tracking-[0.12em] text-neutral-400 sm:py-4 ${index ? "border-t border-white/10" : ""}`}>{term}</dt>
                  <dd className={`px-5 pb-4 pt-1.5 text-[15px] font-light leading-7 text-neutral-300 sm:py-4 ${index ? "sm:border-t sm:border-white/10" : ""}`}>{detail}</dd>
                </div>
              ))}
            </dl>
            <LiveExample origin={API_ORIGIN} locale={locale} />
            <CodeBlock locale={locale} label="javascript · fetch">{drawRequest(locale)}</CodeBlock>
            <p className="mt-6 max-w-[62ch] text-[15px] font-light leading-7 text-neutral-400">{copy.statelessNote}</p>
            <Disclosure summary={copy.equivalentCurl}><CodeBlock locale={locale} label="curl · draw">{drawCurl(locale)}</CodeBlock></Disclosure>
          </section>

          <section id="endpoints" className="scroll-mt-16 border-t border-white/10 py-28">
            <SectionHead index="02" eyebrow={copy.nav[2]} title={copy.errors} />
            <div>
              <Endpoint method="GET" path="/health" description={copy.endpointDescriptions[0]}><CodeBlock locale={locale} label="request">{`curl "${API_BASE}/health"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/cards" description={copy.endpointDescriptions[1]}><CodeBlock locale={locale} label="request">{`curl "${API_BASE}/api/v1/cards?q=moon&locale=${locale}&limit=10"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/cards/{id}" description={copy.endpointDescriptions[2]}><CodeBlock locale={locale} label="request">{`curl "${API_BASE}/api/v1/cards/maj00?locale=${locale}"`}</CodeBlock></Endpoint>
              <Endpoint method="GET" path="/api/v1/spreads" description={copy.endpointDescriptions[3]}><CodeBlock locale={locale} label="request">{`curl "${API_BASE}/api/v1/spreads?locale=${locale}"`}</CodeBlock></Endpoint>
              <Endpoint method="POST" path="/api/v1/readings/draw" description={copy.endpointDescriptions[4]}><CodeBlock locale={locale} label="javascript · fetch">{drawRequest(locale)}</CodeBlock></Endpoint>
              <Endpoint method="POST" path="/api/v1/readings/context" description={copy.endpointDescriptions[5]}><CodeBlock locale={locale} label="request">{`fetch("${API_BASE}/api/v1/readings/context", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ reading, question: "${locale === "zh-CN" ? "如果我等待呢？" : "And if I wait?"}", locale: "${locale}" })\n})`}</CodeBlock></Endpoint>
            </div>
          </section>

          <section id="spreads" className="scroll-mt-16 border-t border-white/10 py-28">
            <SectionHead index="03" eyebrow={copy.nav[3]} title={copy.spreadTitle}>
              {copy.spreadDescription}
            </SectionHead>
            {spreads && <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3 xl:gap-4">{spreads.map((spread) => <SpreadLayout key={spread.id} spread={spread} locale={locale} />)}</div>}
            {!spreads && <p role="status" className="border border-white/10 px-5 py-6 text-center text-[13px] tracking-wide text-neutral-400">{spreadError ? copy.spreadLoadError : copy.spreadLoading}</p>}
            <p className="mt-6 text-[15px] font-light leading-7 text-neutral-400">{copy.spreadDataNote} <code className="font-mono text-white/80">GET /api/v1/spreads</code>; {locale === "zh-CN" ? "创建牌局时使用返回的牌阵 ID。" : "use the returned spread ID when creating a reading."}</p>

            <div className="mt-28 border-t border-white/10 pt-28">
              <SectionHead index="04" eyebrow={copy.agentUse} title={copy.restOrMcp} />
              <p className="mb-8 max-w-[68ch] text-[16px] font-light leading-8 text-neutral-300">{copy.agentDescription} <code className="font-mono text-white/85">/mcp/agent</code>. {copy.agentInstruction} <a className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white" href="/agents.md">{locale === "zh-CN" ? "阅读 Agent 接入指南" : "Read the Agent guide"}</a>. <a className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white" href="https://tarot.songhai.site">{locale === "zh-CN" ? "体验 Frankie Tarot" : "Try Frankie Tarot"}</a>.</p>
              <Eyebrow className="mb-3">{copy.tools}</Eyebrow>
              <ul className="mb-10 border-t border-white/10">
                {["search_tarot_cards", "get_tarot_card", "list_tarot_spreads", "draw_tarot_reading", "get_tarot_reading_context"].map((tool, index) => (
                  <li key={tool} className="flex items-baseline gap-4 border-b border-white/10 py-3">
                    <span className="font-mono text-[9px] text-white/30">0{index + 1}</span>
                    <code className="font-mono text-[14px] text-white/80">{tool}</code>
                  </li>
                ))}
              </ul>
              <div className="grid gap-3 sm:grid-cols-2"><CodeBlock locale={locale} label="MCP · endpoint">{`${API_BASE}/mcp/agent`}</CodeBlock><CodeBlock locale={locale} label="OpenAPI">{`${API_BASE}/openapi.json`}</CodeBlock></div>
              <p className="mt-6 max-w-[68ch] text-[15px] font-light leading-7 text-neutral-400">{copy.agentNote}</p>
            </div>
          </section>

          <section id="response" className="scroll-mt-16 border-t border-white/10 py-28">
            <SectionHead index="05" eyebrow={copy.nav[4]} title={copy.predictable} />
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-[16px] font-light leading-8 text-neutral-300">{copy.responseDescription}</p>
                <ul className="mt-8 border-t border-white/10 text-[15px] font-light leading-7 text-neutral-300">
                  {[
                    <><code className="font-mono text-white/85">reading.seed</code> · {copy.responseBullets[0]}</>,
                    <><code className="font-mono text-white/85">context.cards[].selectedMeaning</code> · {copy.responseBullets[1]}</>,
                    copy.responseBullets[2],
                  ].map((item, index) => (
                    <li key={index} className="flex gap-4 border-b border-white/10 py-4"><span className="mt-3 h-px w-4 shrink-0 bg-white/30" /><span>{item}</span></li>
                  ))}
                </ul>
                <a className="mt-8 inline-flex items-center gap-2 border border-white/20 px-4 py-2.5 text-[13px] tracking-[0.1em] text-neutral-300 transition-colors duration-300 hover:border-white/50 hover:text-white" href={`${import.meta.env.BASE_URL}openapi.json`}>{copy.openapi} <ArrowUpRight size={14} strokeWidth={1.5} /></a>
              </div>
              <CodeBlock locale={locale} label="200 · application/json">{drawResponse}</CodeBlock>
            </div>
          </section>

          <footer className="flex flex-col gap-4 border-t border-white/10 pt-8 text-[9px] font-light uppercase tracking-[0.3em] text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Franklin · MIT License</span>
            <span>{copy.footer[0]}</span>
            <a className="inline-flex items-center gap-1.5 transition-colors duration-300 hover:text-white" href="https://github.com/SonghaiFan/franklin-tarot-api">{copy.footer[1]} <ArrowUpRight size={13} strokeWidth={1.5} /></a>
          </footer>
        </div>
      </main>
    </div>
  );
}
