import cardBackUrl from "./assets/celestial-compass.svg";

/*
 * The Frankie app's card, kept in step with its RitualCard and CardBackSurface:
 * a 7:12 card (7 × 12 cm Rider-Waite), the shared 7% / 4.1% silhouette, and the
 * "standard" 2% white frame around a near-black window. CSS percentage padding is
 * measured from the width on both axes, so the inner radius is recomputed for it.
 */
const CARD_SHAPE = "aspect-[7/12] rounded-[7%/4.1%]";
const INNER_SHAPE = "rounded-[5.2%/3%]";

const ROMAN: Array<[string, number]> = [["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]];

function toRoman(value: number) {
  let roman = "";
  for (const [symbol, amount] of ROMAN) {
    while (value >= amount) {
      roman += symbol;
      value -= amount;
    }
  }
  return roman;
}

/** Same numerals as the app: 0–XXI for the majors, I–X for pips, none for court cards. */
export function romanNumeralFor(cardId: string) {
  const match = /^(maj|wands|cups|swords|pents)(\d+)$/.exec(cardId);
  if (!match) return null;
  const rank = Number(match[2]);
  if (match[1] === "maj") return rank === 0 ? "0" : toRoman(rank);
  return rank <= 10 ? toRoman(rank) : null;
}

type TarotCardProps = {
  className?: string;
} & (
  | { side: "back" }
  | { side: "face"; image: string; name: string; numeral?: string | null; reversed?: boolean; reversedLabel?: string }
);

export default function TarotCard(props: TarotCardProps) {
  return (
    <div className={`relative ${CARD_SHAPE} overflow-hidden bg-white p-[2%] shadow-[0_28px_60px_rgba(0,0,0,0.55)] ${props.className ?? ""}`}>
      <div className={`relative h-full w-full overflow-hidden bg-neutral-950 ${INNER_SHAPE}`}>
        {props.side === "back" ? (
          <>
            <img src={cardBackUrl} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10" />
            <svg viewBox="0 0 100 100" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[15%] w-[15%] -translate-x-1/2 -translate-y-1/2 fill-white/80 drop-shadow-[0_1px_8px_rgba(255,255,255,0.5)]">
              <path d="M50 0C54 34 66 46 100 50 66 54 54 66 50 100 46 66 34 54 0 50 34 46 46 34 50 0Z" />
            </svg>
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/[0.05] via-transparent to-black/25" />
          </>
        ) : (
          <>
            <img src={props.image} alt={props.name} draggable={false} decoding="async" className={`absolute inset-0 h-full w-full object-cover ${props.reversed ? "rotate-180" : ""}`} />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-black/40" />
            <div className="absolute bottom-0 w-full p-[8%] text-center">
              {props.numeral && <div className="mb-0.5 font-cinzel text-[8px] tracking-[0.2em] text-white/60 md:text-[10px]">{props.numeral}</div>}
              <p className="truncate font-cinzel text-[10px] tracking-widest text-white md:text-sm">{props.name}</p>
              {props.reversed && <p className="truncate text-[9px] italic text-red-400/80 md:text-[10px]">({props.reversedLabel ?? "Rev"})</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
