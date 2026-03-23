import { FC } from "react";

interface MatchHeaderProps {
  league: string;
  season: string;
  round?: string;
}

const MatchHeader: FC<MatchHeaderProps> = ({ league, season, round }) => {
  return (
    <header className="border-b border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-sm font-black">ED</span>
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">EDScript Analytics</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
          <span>{league}</span>
          <span className="text-border">•</span>
          <span>{season}</span>
          {round && (
            <>
              <span className="text-border">•</span>
              <span>{round}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-widest">
            Assistente IA
          </span>
        </div>
      </div>
    </header>
  );
};

export default MatchHeader;
