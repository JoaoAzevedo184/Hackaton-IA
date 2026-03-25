import { useMatchData } from "@/hooks/useMatchData";
import {
  MatchHeader,
  Scoreboard,
  HeatMap,
  MatchTimeline,
  ProbabilityBar,
  AIInsightPanel,
  BetCTA,
  ChatAssistant,
} from "@/components/match";

const Index = () => {
  const { data: match, isLoading, error } = useMatchData();

  if (isLoading) return <LoadingSkeleton />;
  if (error || !match) return <ErrorState />;

  const { info, probability, heatPoints, timeline, insights, betRecommendation } = match;

  return (
    <div className="min-h-screen bg-background">
      <MatchHeader
        league={info.league}
        season={info.season}
        round={info.round}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Scoreboard */}
        <AnimatedSection>
          <Scoreboard
            home={info.home}
            away={info.away}
            minute={info.minute}
            half={info.half}
            isLive={info.isLive}
          />
        </AnimatedSection>

        {/* Probabilidade */}
        <AnimatedSection delay={1}>
          <ProbabilityBar
            homeWin={probability.homeWin}
            draw={probability.draw}
            awayWin={probability.awayWin}
            homeName={info.home.name}
            awayName={info.away.name}
          />
        </AnimatedSection>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Esquerda: Heatmap + Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatedSection delay={2}>
              <HeatMap
                points={heatPoints}
                title="Mapa de Calor — Movimentação"
                teamLabel={info.home.shortName}
              />
            </AnimatedSection>
            <AnimatedSection delay={3}>
              <MatchTimeline
                events={timeline}
                homeShortName={info.home.shortName}
                awayShortName={info.away.shortName}
              />
            </AnimatedSection>
          </div>

          {/* Direita: IA + CTA */}
          <div className="space-y-6">
            <AnimatedSection delay={2}>
              <AIInsightPanel insights={insights} />
            </AnimatedSection>
            <AnimatedSection delay={4}>
              <BetCTA
                recommendation={betRecommendation.recommendation}
                confidence={betRecommendation.confidence}
              />
            </AnimatedSection>
          </div>
        </div>
      </main>

      <ChatAssistant />
    </div>
  );
};

// ─── Componentes auxiliares da página ─────────────────────────────────

const DELAY_MAP = [0, 80, 160, 240, 320] as const;

function AnimatedSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="animate-fade-up"
      style={{ opacity: 0, animationDelay: `${DELAY_MAP[delay] ?? 0}ms` }}
    >
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando partida...</p>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">
          Erro ao carregar dados
        </p>
        <p className="text-sm text-muted-foreground">
          Verifique a conexão e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          Recarregar
        </button>
      </div>
    </div>
  );
}

export default Index;
