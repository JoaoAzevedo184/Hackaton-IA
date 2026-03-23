import { FC, useState, useEffect } from "react";

interface Insight {
  title: string;
  text: string;
  confidence: number;
  type: "probability" | "trend" | "value" | "alert";
}

interface AIInsightPanelProps {
  insights: Insight[];
}

const typeColors: Record<Insight["type"], string> = {
  probability: "bg-primary/10 text-primary",
  trend: "bg-accent/10 text-accent",
  value: "bg-heat-mid/10 text-heat-mid",
  alert: "bg-live-pulse/10 text-live-pulse",
};

const typeLabels: Record<Insight["type"], string> = {
  probability: "Probabilidade",
  trend: "Tendência",
  value: "Valor",
  alert: "Alerta",
};

const AIInsightPanel: FC<AIInsightPanelProps> = ({ insights }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleCount((c) => {
        if (c >= insights.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, 350);
    return () => clearInterval(timer);
  }, [insights.length]);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-live-dot" />
        <h3 className="text-sm font-semibold text-foreground">Análise IA — Insights ao Vivo</h3>
      </div>
      <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
        {insights.slice(0, visibleCount).map((insight, i) => (
          <div
            key={i}
            className="p-3 rounded-md bg-secondary/40 border border-border/50 animate-fade-up"
            style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeColors[insight.type]}`}>
                {typeLabels[insight.type]}
              </span>
              <span className="ml-auto font-mono-data text-[10px] text-muted-foreground">
                {Math.round(insight.confidence * 100)}% conf.
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground mb-0.5">{insight.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIInsightPanel;
