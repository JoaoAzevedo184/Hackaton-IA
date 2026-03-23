import { FC } from "react";

interface BetCTAProps {
  recommendation: string;
  confidence: number;
}

const BetCTA: FC<BetCTAProps> = ({ recommendation, confidence }) => {
  return (
    <div className="bg-gradient-to-br from-primary/15 via-card to-primary/5 rounded-lg border border-primary/20 overflow-hidden shadow-[0_0_24px_hsla(142,72%,48%,0.08)]">
      <div className="p-5 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-live-dot" />
          Recomendação IA
        </div>
        <p className="text-sm font-semibold text-foreground leading-relaxed">{recommendation}</p>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xs text-muted-foreground">Confiança:</span>
          <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="font-mono-data text-xs font-semibold text-primary">{confidence}%</span>
        </div>
        <button className="mt-2 w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide transition-all hover:shadow-[0_0_20px_hsla(142,72%,48%,0.3)] active:scale-[0.97]">
          Apostar Agora
        </button>
      </div>
    </div>
  );
};

export default BetCTA;
