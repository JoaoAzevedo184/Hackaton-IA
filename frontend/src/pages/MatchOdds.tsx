import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMatchData } from "@/hooks/useMatchData";
import { useMatchOdds } from "@/hooks/useMatchOdds";
import { useLiveTimer } from "@/hooks/useLiveTimer";
import type { OddCategory, OddMarket, OddValue } from "@/hooks/useMatchOdds";
import { ArrowLeft, ChevronUp, ChevronDown, Sparkles, TrendingUp } from "lucide-react";

const TABS = [
  { id: "Todos", label: "Todos" },
  { id: "Resultado", label: "Resultado" },
  { id: "Partida", label: "Partida" },
  { id: "Total de Gols", label: "Gols" },
  { id: "Handicaps", label: "Handicap" },
  { id: "Especiais", label: "Especiais" },
];

const MatchOdds = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading: matchLoading } = useMatchData(matchId);
  const { data: oddsData, isLoading: oddsLoading } = useMatchOdds(matchId);
  const [activeTab, setActiveTab] = useState("Todos");

  const { minute: liveMinute, half: liveHalf } = useLiveTimer(
    match?.info.minute ?? "0",
    match?.info.half ?? "",
    match?.info.isLive ?? false,
  );

  if (matchLoading || oddsLoading) return <LoadingState />;
  if (!match) return <ErrorState matchId={matchId} />;

  const { info } = match;

  const filteredCategories = oddsData?.categories.filter(
    (c) => activeTab === "Todos" || c.name === activeTab,
  ) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to={`/match/${matchId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar à partida</span>
          </Link>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-widest">
            Mercados
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Scoreboard mini */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <TeamBadge name={info.home.name} logo={info.home.logo} shortName={info.home.shortName} />
            <div className="text-center">
              {info.isLive && (
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-live-pulse animate-live-dot" />
                  <span className="text-[10px] font-semibold text-live-pulse uppercase">Ao Vivo</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black font-mono-data text-score">{info.home.score}</span>
                <span className="text-xl text-muted-foreground">-</span>
                <span className="text-4xl font-black font-mono-data text-score">{info.away.score}</span>
              </div>
              <p className="text-[10px] font-mono-data text-muted-foreground mt-1">
                {liveHalf} • {liveMinute}
              </p>
            </div>
            <TeamBadge name={info.away.name} logo={info.away.logo} shortName={info.away.shortName} reverse />
          </div>
        </div>

        {/* AI Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-card to-primary/5 rounded-xl border border-primary/20 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-foreground">Análise IA dos Mercados</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-live-dot" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As barras de probabilidade mostram a previsão da IA para cada resultado.
              Opções com <Sparkles size={10} className="inline text-primary" />{" "}
              indicam <span className="text-primary font-semibold">valor identificado</span> — quando a
              probabilidade real é maior que a odd sugere.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const count = tab.id === "Todos"
              ? oddsData?.categories.reduce((s, c) => s + c.markets.length, 0) ?? 0
              : oddsData?.categories.find((c) => c.name === tab.id)?.markets.length ?? 0;

            if (tab.id !== "Todos" && count === 0) return null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Odds */}
        {!oddsData?.available ? (
          <EmptyOdds />
        ) : filteredCategories.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum mercado nesta categoria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <CollapsibleCategory
                key={category.name}
                category={category}
                homeName={info.home.shortName}
                awayName={info.away.shortName}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// ─── Collapsible Category ────────────────────────────────────────────

const CollapsibleCategory = ({
  category,
  homeName,
  awayName,
}: {
  category: OddCategory;
  homeName: string;
  awayName: string;
}) => {
  const [open, setOpen] = useState(true);
  const hasValue = category.markets.some((m) => m.odds.some((o) => o.isHighlighted));

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Category header — clickable to collapse */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-foreground">{category.name}</h3>
          {hasValue && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              <TrendingUp size={10} /> VALOR
            </span>
          )}
        </div>
        {open ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>

      {/* Markets */}
      {open && (
        <div className="px-5 pb-5 space-y-5">
          {category.markets.map((market) => (
            <MarketSection key={market.id} market={market} homeName={homeName} awayName={awayName} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Market Section ──────────────────────────────────────────────────

const MarketSection = ({
  market,
  homeName,
  awayName,
}: {
  market: OddMarket;
  homeName: string;
  awayName: string;
}) => {
  const processedOdds = market.odds.map((odd) => ({
    ...odd,
    label: odd.label.replace("Mandante", homeName).replace("Visitante", awayName),
  }));

  // Calculate total implied probability for normalization
  const totalProb = processedOdds.reduce((sum, o) => {
    const v = parseFloat(o.value);
    return sum + (v > 0 ? 1 / v : 0);
  }, 0);

  // Find the best value (lowest odd = most probable)
  const minOddValue = Math.min(...processedOdds.map((o) => parseFloat(o.value) || 99));

  // Decide grid: 3 cols for 3 items, 2 cols for 2 or even numbers
  const cols = processedOdds.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {market.name}
      </p>
      <div className={`grid ${cols} gap-2.5`}>
        {processedOdds.map((odd, i) => {
          const value = parseFloat(odd.value);
          const impliedProb = totalProb > 0 && value > 0 ? (1 / value) / totalProb * 100 : 0;
          const isRecommended = value === minOddValue && impliedProb > 50;
          const isValue = odd.isHighlighted;

          return (
            <OddCard
              key={i}
              odd={odd}
              impliedProb={impliedProb}
              isRecommended={isRecommended}
              isValue={isValue}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Odd Card ────────────────────────────────────────────────────────

const OddCard = ({
  odd,
  impliedProb,
  isRecommended,
  isValue,
}: {
  odd: OddValue;
  impliedProb: number;
  isRecommended: boolean;
  isValue: boolean;
}) => {
  const value = parseFloat(odd.value);

  // Bar color based on probability
  const barColor =
    impliedProb > 55 ? "bg-primary" :       // green
    impliedProb > 35 ? "bg-yellow-500" :     // yellow
    "bg-accent";                              // blue

  return (
    <div
      className={`relative rounded-lg p-4 border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
        isRecommended
          ? "bg-primary/8 border-primary/40 shadow-[0_0_16px_hsla(142,72%,48%,0.1)]"
          : "bg-secondary/20 border-border/50 hover:border-border"
      }`}
    >
      {/* IA RECOMENDA badge */}
      {isRecommended && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap shadow-md">
          <Sparkles size={8} />
          IA RECOMENDA
        </div>
      )}

      {/* Label */}
      <p className={`text-[10px] text-center uppercase tracking-wider mb-2 ${
        isRecommended ? "text-foreground font-semibold mt-1" : "text-muted-foreground"
      }`}>
        {odd.label}
      </p>

      {/* Odd value */}
      <p className={`text-2xl font-black font-mono-data text-center mb-3 ${
        isRecommended ? "text-primary" : "text-foreground"
      }`}>
        {value.toFixed(2)}
      </p>

      {/* Progress bar + percentage */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-700`}
            style={{ width: `${Math.min(100, impliedProb)}%` }}
          />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <span className={`text-[10px] font-mono-data font-semibold ${
            isValue ? "text-primary" : "text-muted-foreground"
          }`}>
            {impliedProb.toFixed(0)}%
          </span>
          {isValue && <Sparkles size={8} className="text-primary" />}
        </div>
      </div>
    </div>
  );
};

// ─── Team Badge ──────────────────────────────────────────────────────

const TeamBadge = ({
  name, logo, shortName, reverse,
}: {
  name: string; logo: string; shortName: string; reverse?: boolean;
}) => {
  const isUrl = logo.startsWith("http");
  const logoEl = isUrl ? (
    <img src={logo} alt={shortName} className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
  ) : (
    <span className="text-2xl">{logo}</span>
  );

  return (
    <div className={`flex items-center gap-3 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      {logoEl}
      <div>
        <p className="text-sm font-bold text-foreground">{name}</p>
        <p className="text-[10px] text-muted-foreground font-mono-data">{shortName}</p>
      </div>
    </div>
  );
};

// ─── States ──────────────────────────────────────────────────────────

const EmptyOdds = () => (
  <div className="bg-card rounded-xl border border-border p-10 text-center">
    <span className="text-3xl block mb-3">📊</span>
    <p className="text-sm font-medium text-foreground">Odds não disponíveis para esta partida.</p>
    <p className="text-xs text-muted-foreground mt-1">Geralmente disponível para ligas grandes e jogos próximos.</p>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Carregando mercados...</p>
    </div>
  </div>
);

const ErrorState = ({ matchId }: { matchId?: string }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-3">
      <p className="text-lg font-semibold text-foreground">Erro ao carregar</p>
      <div className="flex gap-3 justify-center">
        <Link to={matchId ? `/match/${matchId}` : "/"} className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium">Voltar</Link>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Recarregar</button>
      </div>
    </div>
  </div>
);

export default MatchOdds;