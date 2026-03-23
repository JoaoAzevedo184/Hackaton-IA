import { FC } from "react";
import type { Team } from "@/types";

interface ScoreboardProps {
  home: Team;
  away: Team;
  minute: string;
  half: string;
  isLive?: boolean;
}

const Scoreboard: FC<ScoreboardProps> = ({
  home,
  away,
  minute,
  half,
  isLive = true,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-5 bg-card rounded-lg border border-border">
      <TeamDisplay team={home} align="left" />
      <ScoreCenter
        homeScore={home.score}
        awayScore={away.score}
        minute={minute}
        half={half}
        isLive={isLive}
      />
      <TeamDisplay team={away} align="right" />
    </div>
  );
};

// ─── Sub-componentes ─────────────────────────────────────────────────

const TeamDisplay: FC<{ team: Team; align: "left" | "right" }> = ({
  team,
  align,
}) => {
  const isRight = align === "right";

  return (
    <div
      className={`flex items-center gap-4 flex-1 ${
        isRight ? "justify-end text-right" : ""
      }`}
    >
      {!isRight && <span className="text-3xl">{team.logo}</span>}
      <div>
        <p className="text-lg font-bold text-foreground">{team.name}</p>
        <p className="text-sm text-muted-foreground">{team.shortName}</p>
      </div>
      {isRight && <span className="text-3xl">{team.logo}</span>}
    </div>
  );
};

const ScoreCenter: FC<{
  homeScore: number;
  awayScore: number;
  minute: string;
  half: string;
  isLive: boolean;
}> = ({ homeScore, awayScore, minute, half, isLive }) => (
  <div className="flex flex-col items-center gap-1 px-8">
    {isLive && <LiveBadge />}
    <div className="flex items-center gap-3">
      <span className="text-5xl font-black font-mono-data text-score">
        {homeScore}
      </span>
      <span className="text-2xl text-muted-foreground font-light">:</span>
      <span className="text-5xl font-black font-mono-data text-score">
        {awayScore}
      </span>
    </div>
    <p className="text-xs text-muted-foreground font-mono-data mt-1">
      {half} • {minute}
    </p>
  </div>
);

const LiveBadge: FC = () => (
  <div className="flex items-center gap-2 mb-1">
    <span className="w-2 h-2 rounded-full bg-live-pulse animate-live-dot" />
    <span className="text-xs font-semibold text-live-pulse uppercase tracking-wider">
      AO VIVO
    </span>
  </div>
);

export default Scoreboard;
