type Position = { x: number; y: number; rotation?: number };
type Spread = {
  id: string;
  name: string;
  cardCount: number;
  labels: string[];
  layout?: { type: "flex" | "absolute"; positions: Position[] | null };
};

type IconCard = { x: number; y: number; w: number; h: number; rotate?: number };

function cardsFor(spread: Spread): IconCard[] {
  if (spread.layout?.type === "absolute" && spread.layout.positions?.length) {
    const positions = spread.layout.positions;
    const xs = positions.map(({ x }) => x);
    const ys = positions.map(({ y }) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 2.5;
    const width = 24 - pad * 2;
    const height = 24 - pad * 2;
    const w = 3.8;
    const h = 5.8;

    return positions.map((position) => {
      const cx = pad + ((position.x - minX) / (maxX - minX || 1)) * width;
      const cy = pad + ((position.y - minY) / (maxY - minY || 1)) * height;
      return { x: cx - w / 2, y: cy - h / 2, w, h, rotate: position.rotation };
    });
  }

  const count = spread.cardCount;
  const w = count <= 1 ? 5 : count <= 4 ? 4 : count <= 7 ? 3 : 2.4;
  const gap = count >= 10 ? 0.6 : 1;
  const h = Math.min(8, Math.max(4.5, w * 1.55));
  const startX = (24 - (count * w + Math.max(0, count - 1) * gap)) / 2;
  const y = (24 - h) / 2;
  return Array.from({ length: count }, (_, index) => ({ x: startX + index * (w + gap), y, w, h }));
}

function SpreadDiagram({ spread }: { spread: Spread }) {
  const cards = cardsFor(spread);
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={`${spread.name} relative card layout`} className="mx-auto my-6 h-36 w-full max-w-[200px] overflow-visible transition-[filter] duration-500 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]">
      {cards.map((card, index) => (
        <g key={index}>
          <rect x={card.x} y={card.y} width={card.w} height={card.h} rx="0.9" ry="0.9" transform={card.rotate ? `rotate(${card.rotate} ${card.x + card.w / 2} ${card.y + card.h / 2})` : undefined} className="fill-white/70 transition-[fill] duration-500 group-hover:fill-white/95" />
          <text x={card.x + card.w / 2} y={card.y + card.h / 2 + .65} textAnchor="middle" fill="#030308" fontFamily="Jost, ui-sans-serif, sans-serif" fontWeight="500" fontSize="1.8">{index + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export default function SpreadLayout({ spread }: { spread: Spread }) {
  return (
    <article className="group flex flex-col border border-white/10 p-4 transition-colors duration-500 hover:border-white/30 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-cinzel text-[11px] uppercase tracking-[0.16em] text-white/80">{spread.name}</h3>
        <span className="shrink-0 text-[9px] font-light uppercase tracking-[0.24em] text-neutral-500">{spread.cardCount} {spread.cardCount === 1 ? "card" : "cards"}</span>
      </div>
      <SpreadDiagram spread={spread} />
      <ol className="mt-auto border-t border-white/10" aria-label={`${spread.name} positions in draw order`}>
        {spread.labels.map((label, index) => (
          <li key={`${index}-${label}`} className="flex items-baseline gap-3 border-b border-white/5 py-1.5 text-[10px] font-light leading-4 text-neutral-400 last:border-b-0">
            <span className="w-4 shrink-0 font-mono text-[9px] text-white/30">{String(index + 1).padStart(2, "0")}</span>
            {label.replace(new RegExp(`^${index + 1}\\.\\s*`), "")}
          </li>
        ))}
      </ol>
    </article>
  );
}

export type { Spread };
