import { FC } from "react";

interface Team {
  name: string;
  shortName: string;
  logo: string;
  score: number;
}

interface ScoreboardProps {
  home: Team;
  away: Team;
  minute: string;
  half: string;
  isLive?: boolean;
}

const Scoreboard: FC<ScoreboardProps> = ({ home, away, minute, half, isLive = true }) => {
  return (
    <div className="flex items-center justify-between px-6 py-5 bg-card rounded-lg border border-border">
      {/* Home */}
      <div className="flex items-center gap-4 flex-1">
        <span className="text-3xl">{home.logo}</span>
        <div>
          <p className="text-lg font-bold text-foreground">{home.name}</p>
          <p className="text-sm text-muted-foreground">{home.shortName}</p>
        </div>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center gap-1 px-8">
        {isLive && (
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-live-pulse animate-live-dot" />
            <span className="text-xs font-semibold text-live-pulse uppercase tracking-wider">AO VIVO</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-5xl font-black font-mono-data text-score">{home.score}</span>
          <span className="text-2xl text-muted-foreground font-light">:</span>
          <span className="text-5xl font-black font-mono-data text-score">{away.score}</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono-data mt-1">
          {half} • {minute}
        </p>
      </div>

      {/* Away */}
      <div className="flex items-center gap-4 flex-1 justify-end text-right">
        <div>
          <p className="text-lg font-bold text-foreground">{away.name}</p>
          <p className="text-sm text-muted-foreground">{away.shortName}</p>
        </div>
        <span className="text-3xl">{away.logo}</span>
      </div>
    </div>
  );
};

export default Scoreboard;
