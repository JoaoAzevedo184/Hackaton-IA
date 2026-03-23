import { FC } from "react";
import type { MatchProbability } from "@/types";

interface ProbabilityBarProps extends MatchProbability {
  homeName: string;
  awayName: string;
}

const ProbabilityBar: FC<ProbabilityBarProps> = ({
  homeWin,
  draw,
  awayWin,
  homeName,
  awayName,
}) => {
  const segments: BarSegment[] = [
    { value: homeWin, className: "bg-stat-bar" },
    { value: draw, className: "bg-muted-foreground/40" },
    { value: awayWin, className: "bg-stat-bar-away" },
  ];

  const odds: OddCardData[] = [
    { label: homeName, value: homeWin, highlighted: homeWin > awayWin && homeWin > draw },
    { label: "Empate", value: draw, highlighted: false },
    { label: awayName, value: awayWin, highlighted: awayWin > homeWin && awayWin > draw },
  ];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground text-center">
          Probabilidade de Resultado
        </h3>
      </div>
      <div className="p-4 space-y-4">
        <VisualBar segments={segments} />
        <Legend homeName={homeName} awayName={awayName} />
        <div className="grid grid-cols-3 gap-2">
          {odds.map((odd) => (
            <OddCard key={odd.label} {...odd} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-componentes ─────────────────────────────────────────────────

interface BarSegment {
  value: number;
  className: string;
}

const VisualBar: FC<{ segments: BarSegment[] }> = ({ segments }) => (
  <div className="flex h-10 rounded-lg overflow-hidden gap-0.5">
    {segments.map((seg, i) => (
      <div
        key={i}
        className={`${seg.className} flex items-center justify-center transition-all duration-1000 ease-out`}
        style={{ width: `${seg.value}%` }}
      >
        <span className="text-xs font-bold text-primary-foreground font-mono-data">
          {seg.value.toFixed(1)}%
        </span>
      </div>
    ))}
  </div>
);

const Legend: FC<{ homeName: string; awayName: string }> = ({
  homeName,
  awayName,
}) => {
  const items = [
    { label: homeName, className: "bg-stat-bar" },
    { label: "Empate", className: "bg-muted-foreground/40" },
    { label: awayName, className: "bg-stat-bar-away" },
  ];

  return (
    <div className="flex justify-between text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-sm ${item.className}`} />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

interface OddCardData {
  label: string;
  value: number;
  highlighted: boolean;
}

const OddCard: FC<OddCardData> = ({ label, value, highlighted }) => {
  const impliedOdd = toOdd(value);

  return (
    <div
      className={`rounded-md p-3 text-center border transition-all ${
        highlighted
          ? "bg-primary/10 border-primary/30 shadow-[0_0_12px_hsla(142,72%,48%,0.15)]"
          : "bg-secondary/40 border-border/50"
      }`}
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-bold font-mono-data ${
          highlighted ? "text-primary" : "text-foreground"
        }`}
      >
        {value.toFixed(1)}%
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        Odd <span className="font-mono-data text-foreground">{impliedOdd}</span>
      </p>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────

/** Converte probabilidade percentual em odd decimal */
function toOdd(probability: number): string {
  if (probability <= 0) return "—";
  return (100 / probability).toFixed(2);
}

export default ProbabilityBar;
