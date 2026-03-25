import { FC } from "react";

interface MatchHeaderProps {
  league: string;
  season: string;
  round?: string;
}

// TODO: mover para constants/brand.ts quando houver mais config de marca
const BRAND = {
  initials: "ED",
  name: "EDScript Analytics",
} as const;

const MatchHeader: FC<MatchHeaderProps> = ({ league, season, round }) => {
  return (
    <header className="border-b border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-sm font-black">
              {BRAND.initials}
            </span>
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">
            {BRAND.name}
          </span>
        </div>

        <LeagueInfo league={league} season={season} round={round} />

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-widest">
            Assistente IA
          </span>
        </div>
      </div>
    </header>
  );
};

const LeagueInfo: FC<{ league: string; season: string; round?: string }> = ({
  league,
  season,
  round,
}) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span>🏴󠁧󠁢󠁥󠁮󠁧󠁿</span>
    <span>{league}</span>
    <Dot />
    <span>{season}</span>
    {round && (
      <>
        <Dot />
        <span>{round}</span>
      </>
    )}
  </div>
);

const Dot: FC = () => <span className="text-border">•</span>;

export default MatchHeader;
