import { FC } from "react";

interface ProbabilityBarProps {
  homeWin: number;
  draw: number;
  awayWin: number;
  homeName: string;
  awayName: string;
}

const ProbabilityBar: FC<ProbabilityBarProps> = ({ homeWin, draw, awayWin, homeName, awayName }) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground text-center">Probabilidade de Resultado</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Visual bar */}
        <div className="flex h-10 rounded-lg overflow-hidden gap-0.5">
          <div
            className="bg-stat-bar flex items-center justify-center transition-all duration-1000 ease-out"
            style={{ width: `${homeWin}%` }}
          >
            <span className="text-xs font-bold text-primary-foreground font-mono-data">
              {homeWin.toFixed(1)}%
            </span>
          </div>
          <div
            className="bg-muted-foreground/40 flex items-center justify-center transition-all duration-1000 ease-out"
            style={{ width: `${draw}%` }}
          >
            <span className="text-xs font-bold text-foreground font-mono-data">
              {draw.toFixed(1)}%
            </span>
          </div>
          <div
            className="bg-stat-bar-away flex items-center justify-center transition-all duration-1000 ease-out"
            style={{ width: `${awayWin}%` }}
          >
            <span className="text-xs font-bold text-primary-foreground font-mono-data">
              {awayWin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-stat-bar" />
            <span className="text-muted-foreground">{homeName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40" />
            <span className="text-muted-foreground">Empate</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-stat-bar-away" />
            <span className="text-muted-foreground">{awayName}</span>
          </div>
        </div>

        {/* Odds cards */}
        <div className="grid grid-cols-3 gap-2">
          <OddCard label={homeName} value={homeWin} odd={homeWin < 30 ? (100 / homeWin).toFixed(2) : (100 / homeWin).toFixed(2)} highlighted={homeWin > awayWin && homeWin > draw} />
          <OddCard label="Empate" value={draw} odd={(100 / draw).toFixed(2)} highlighted={false} />
          <OddCard label={awayName} value={awayWin} odd={(100 / awayWin).toFixed(2)} highlighted={awayWin > homeWin && awayWin > draw} />
        </div>
      </div>
    </div>
  );
};

const OddCard: FC<{ label: string; value: number; odd: string; highlighted: boolean }> = ({
  label, value, odd, highlighted,
}) => (
  <div className={`rounded-md p-3 text-center border transition-all ${
    highlighted
      ? "bg-primary/10 border-primary/30 shadow-[0_0_12px_hsla(142,72%,48%,0.15)]"
      : "bg-secondary/40 border-border/50"
  }`}>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-lg font-bold font-mono-data ${highlighted ? "text-primary" : "text-foreground"}`}>
      {value.toFixed(1)}%
    </p>
    <p className="text-[10px] text-muted-foreground mt-0.5">
      Odd <span className="font-mono-data text-foreground">{odd}</span>
    </p>
  </div>
);

export default ProbabilityBar;
