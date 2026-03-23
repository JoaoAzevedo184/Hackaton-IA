import { FC } from "react";

export interface TimelineEvent {
  minute: number;
  type: "goal" | "yellow" | "red" | "substitution" | "corner" | "shot" | "save";
  team: "home" | "away";
  description: string;
  player?: string;
}

interface MatchTimelineProps {
  events: TimelineEvent[];
}

const eventIcons: Record<TimelineEvent["type"], string> = {
  goal: "⚽",
  yellow: "🟨",
  red: "🟥",
  substitution: "🔄",
  corner: "📐",
  shot: "🎯",
  save: "🧤",
};

const MatchTimeline: FC<MatchTimelineProps> = ({ events }) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Linha Cronológica</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {events.map((event, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors hover:bg-secondary/30 ${
              event.type === "goal" ? "bg-primary/5" : ""
            }`}
          >
            <span className="font-mono-data text-xs text-muted-foreground w-8 pt-0.5 shrink-0">
              {event.minute}'
            </span>
            <span className="text-base shrink-0">{eventIcons[event.type]}</span>
            <div className="min-w-0">
              {event.player && (
                <p className="text-sm font-semibold text-foreground truncate">{event.player}</p>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
            </div>
            <span
              className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                event.team === "home"
                  ? "text-stat-bar bg-stat-bar/10"
                  : "text-stat-bar-away bg-stat-bar-away/10"
              }`}
            >
              {event.team === "home" ? "ARS" : "MNC"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchTimeline;
