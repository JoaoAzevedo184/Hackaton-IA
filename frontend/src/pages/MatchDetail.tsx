import { useParams, Link } from "react-router-dom";
import { useMatchData } from "@/hooks/useMatchData";
import { useLiveTimer } from "@/hooks/useLiveTimer";
import { useTimelineHeatPoints } from "@/hooks/useTimelineHeatPoints";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { usePlayerPositions } from "@/hooks/usePlayerPositions";
import { useLineup } from "@/hooks/useLineup";
import {
  MatchHeader, Scoreboard, MatchTimeline, ProbabilityBar,
  AIInsightPanel, BetCTA, ChatAssistant,
} from "@/components/match";
import HeatMap3D from "@/components/match/HeatMap3D";
import { ArrowLeft } from "lucide-react";
import type { MatchState } from "@/types";

const MatchDetail = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading, error } = useMatchData(matchId);

  const { minute: liveMinute, half: liveHalf } = useLiveTimer(
    match?.info.minute ?? "0", match?.info.half ?? "", match?.info.isLive ?? false,
  );

  const eventPoints = useTimelineHeatPoints(match?.timeline ?? [], liveMinute);
  const { data: aiResult, isLoading: aiLoading } = useAIAnalysis(match);
  const { data: lineupData } = useLineup(matchId);

  const statsForPlayers = match ? buildStatsProxy(match) : {};

  // Agora passa a timeline pro hook reagir aos eventos
  const playerDots = usePlayerPositions(
    statsForPlayers,
    liveMinute,
    match?.timeline ?? [],
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error || !match) return <ErrorState />;

  const { info, probability, heatPoints, timeline, insights, betRecommendation } = match;

  const finalProbability = aiResult?.probability ?? probability;
  const finalInsights = aiResult?.insights?.length ? aiResult.insights : insights;
  const finalRecommendation = aiResult
    ? { recommendation: aiResult.recommendation, confidence: aiResult.confidence }
    : betRecommendation;

  return (
    <div className="min-h-screen bg-background">
      <MatchHeader league={info.league} season={info.season} round={info.round} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Voltar ao Dashboard
        </Link>

        <AnimatedSection>
          <Scoreboard home={info.home} away={info.away} minute={liveMinute} half={liveHalf} isLive={info.isLive} />
        </AnimatedSection>

        <AnimatedSection delay={1}>
          <div className="relative">
            {aiLoading && (
              <div className="absolute -top-2 right-2 z-10 flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-live-dot" />Edson analisando...
              </div>
            )}
            {aiResult && !aiLoading && (
              <div className="absolute -top-2 right-2 z-10 flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />Análise IA do Edson
              </div>
            )}
            <ProbabilityBar homeWin={finalProbability.homeWin} draw={finalProbability.draw} awayWin={finalProbability.awayWin} homeName={info.home.name} awayName={info.away.name} />
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnimatedSection delay={2}>
              <HeatMap3D
                points={heatPoints}
                eventPoints={eventPoints}
                playerDots={playerDots}
                title="Mapa de Calor 3D — Movimentação"
                homeLabel={info.home.shortName}
                awayLabel={info.away.shortName}
                currentMinute={`${liveHalf} • ${liveMinute}`}
              />
            </AnimatedSection>
            <AnimatedSection delay={3}>
              <MatchTimeline events={timeline} homeShortName={info.home.shortName} awayShortName={info.away.shortName} />
            </AnimatedSection>
          </div>

          <div className="space-y-6">
            <AnimatedSection delay={2}>
              <AIInsightPanel insights={finalInsights} />
            </AnimatedSection>
            <AnimatedSection delay={4}>
              <BetCTA recommendation={finalRecommendation.recommendation} confidence={finalRecommendation.confidence} />
            </AnimatedSection>
          </div>
        </div>
      </main>

      <ChatAssistant />
    </div>
  );
};

function buildStatsProxy(match: MatchState): Record<string, unknown> {
  const { probability, heatPoints } = match;
  const totalProb = probability.homeWin + probability.awayWin;
  const homePoss = totalProb > 0 ? Math.round((probability.homeWin / totalProb) * 100) : 50;
  const homeHeat = heatPoints.filter((p) => p.x > 60).length;
  const awayHeat = heatPoints.filter((p) => p.x < 40).length;
  return {
    possession_rt: [String(homePoss), String(100 - homePoss)],
    attacks: [String(homeHeat * 15), String(awayHeat * 15)],
    dangerous_attacks: [String(homeHeat * 8), String(awayHeat * 8)],
  };
}

const DELAY_MAP = [0, 80, 160, 240, 320] as const;
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return <div className="animate-fade-up" style={{ opacity: 0, animationDelay: `${DELAY_MAP[delay] ?? 0}ms` }}>{children}</div>;
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
        <p className="text-lg font-semibold text-foreground">Erro ao carregar dados</p>
        <p className="text-sm text-muted-foreground">Verifique a conexão e tente novamente.</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <Link to="/" className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">Voltar ao Dashboard</Link>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Recarregar</button>
        </div>
      </div>
    </div>
  );
}

export default MatchDetail;