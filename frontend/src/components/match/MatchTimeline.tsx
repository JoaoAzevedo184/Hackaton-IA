import { FC } from "react";
import type { TimelineEvent, TeamSide } from "@/types";
import { EVENT_ICONS } from "@/constants";

interface MatchTimelineProps {
  events: TimelineEvent[];
  homeShortName?: string;
  awayShortName?: string;
}

const TEAM_STYLES: Record<TeamSide, string> = {
  home: "text-stat-bar bg-stat-bar/10",
  away: "text-stat-bar-away bg-stat-bar-away/10",
};

const MatchTimeline: FC<MatchTimelineProps> = ({
  events,
  homeShortName = "HOME",
  awayShortName = "AWAY",
}) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Linha Cronológica
        </h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {events.map((event, i) => (
          <TimelineRow
            key={`${event.minute}-${event.type}-${i}`}
            event={event}
            teamLabel={
              event.team === "home" ? homeShortName : awayShortName
            }
          />
        ))}
      </div>
    </div>
  );
};

// ─── Sub-componente extraído para evitar JSX denso ───────────────────

const TimelineRow: FC<{ event: TimelineEvent; teamLabel: string }> = ({
  event,
  teamLabel,
}) => (
  <div
    className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors hover:bg-secondary/30 ${
      event.type === "goal" ? "bg-primary/5" : ""
    }`}
  >
    <span className="font-mono-data text-xs text-muted-foreground w-8 pt-0.5 shrink-0">
      {event.minute}'
    </span>
    <span className="text-base shrink-0">{EVENT_ICONS[event.type]}</span>
    <div className="min-w-0">
      {event.player && (
        <p className="text-sm font-semibold text-foreground truncate">
          {event.player}
        </p>
      )}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {event.description}
      </p>
    </div>
    <span
      className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${TEAM_STYLES[event.team]}`}
    >
      {teamLabel}
    </span>
  </div>
);

export default MatchTimeline;
