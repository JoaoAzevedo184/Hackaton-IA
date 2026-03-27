import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  fetchInplayEvents,
  fetchEndedEvents,
  fetchUpcomingEvents,
  getLastNDays,
  getNextNDays,
  formatTime,
  formatTimeUntil,
  teamLogoUrl,
  flagUrl,
  isEsports,
  extractCountries,
  countByCountry,
  getCountryName,
  getHalfLabel,
  type BetsApiEvent,
  type BetsApiStats,
  type BetsApiTimer,
} from "@/services/betsapiService";
import { ChatAssistant } from "@/components/match";

const REFETCH_LIVE_MS = 30_000;
const DAYS_TO_SHOW = 3;

const Dashboard = () => {
  const pastDays = getLastNDays(DAYS_TO_SHOW);
  const futureDays = getNextNDays(DAYS_TO_SHOW);

  // ─── Filtros ─────────────────────────────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hideEsports, setHideEsports] = useState(true);
  const [selectedDay, setSelectedDay] = useState(pastDays[0].day);
  const [endedPage, setEndedPage] = useState(1);
  const [endedCountry, setEndedCountry] = useState<string | null>(null);

  // Upcoming filters
  const [upcomingDay, setUpcomingDay] = useState(futureDays[0].day);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingCountry, setUpcomingCountry] = useState<string | null>(null);

  // ─── Queries ─────────────────────────────────────────────────────
  const {
    data: rawLive = [],
    isLoading: liveLoading,
    error: liveError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["betsapi", "inplay"],
    queryFn: fetchInplayEvents,
    refetchInterval: REFETCH_LIVE_MS,
  });

  const {
    data: upcomingData,
    isLoading: upcomingLoading,
    error: upcomingError,
  } = useQuery({
    queryKey: ["betsapi", "upcoming", upcomingDay, upcomingPage, upcomingCountry],
    queryFn: () => fetchUpcomingEvents(upcomingDay, upcomingPage, upcomingCountry ?? undefined),
  });

  const {
    data: endedData,
    isLoading: endedLoading,
    error: endedError,
  } = useQuery({
    queryKey: ["betsapi", "ended", selectedDay, endedPage, endedCountry],
    queryFn: () => fetchEndedEvents(selectedDay, endedPage, endedCountry ?? undefined),
  });

  useEffect(() => setEndedPage(1), [selectedDay, endedCountry]);
  useEffect(() => setUpcomingPage(1), [upcomingDay, upcomingCountry]);

  // ─── Filtrar ao vivo ─────────────────────────────────────────────
  const liveEvents = useMemo(() => {
    let filtered = rawLive.filter((e) => e.sport_id === "1");
    if (hideEsports) filtered = filtered.filter((e) => !isEsports(e));
    if (selectedCountry) filtered = filtered.filter((e) => e.league.cc === selectedCountry);
    return filtered;
  }, [rawLive, selectedCountry, hideEsports]);

  const realLive = useMemo(() => rawLive.filter((e) => e.sport_id === "1" && !isEsports(e)), [rawLive]);
  const countries = useMemo(() => extractCountries(rawLive.filter((e) => e.sport_id === "1")), [rawLive]);
  const countryCounts = useMemo(() => countByCountry(rawLive.filter((e) => e.sport_id === "1")), [rawLive]);
  const esportsCount = useMemo(() => rawLive.filter((e) => e.sport_id === "1" && isEsports(e)).length, [rawLive]);

  const endedEvents = endedData?.events ?? [];
  const endedTotal = endedData?.total ?? 0;

  const upcomingEvents = useMemo(() => {
    const events = upcomingData?.events ?? [];
    return events.filter((e) => e.sport_id === "1" && !isEsports(e));
  }, [upcomingData]);
  const upcomingTotal = upcomingData?.total ?? 0;

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo-32x32.png" alt="Esportes da Sorte" className="w-8 h-8 rounded" />
            <span className="text-sm font-bold text-foreground tracking-tight">Esportes da Sorte</span>
          </Link>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-[10px] font-mono-data text-muted-foreground">
                Atualizado {lastUpdate}
              </span>
            )}
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded uppercase tracking-widest">
              IA Analytics
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SEÇÃO: AO VIVO                                            */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-live-pulse animate-live-dot" />
            <h2 className="text-lg font-bold text-foreground">Ao Vivo</h2>
            <span className="text-xs font-mono-data text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {realLive.length} {realLive.length === 1 ? "jogo" : "jogos"}
            </span>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-4">
            <FilterChip
              label="Todos"
              count={realLive.length}
              active={selectedCountry === null && hideEsports}
              onClick={() => { setSelectedCountry(null); setHideEsports(true); }}
            />
            {countries.map((c) => (
              <FilterChip
                key={c.code}
                label={getCountryName(c.code)}
                count={countryCounts[c.code] || 0}
                flag={c.code}
                active={selectedCountry === c.code}
                onClick={() => {
                  setSelectedCountry(selectedCountry === c.code ? null : c.code);
                  setHideEsports(true);
                }}
              />
            ))}
            {esportsCount > 0 && (
              <FilterChip
                label="eSports"
                count={esportsCount}
                active={!hideEsports}
                onClick={() => {
                  setHideEsports(!hideEsports);
                  setSelectedCountry(null);
                }}
              />
            )}
          </div>

          {/* Grid de jogos */}
          {liveLoading ? (
            <LoadingGrid count={4} />
          ) : liveError ? (
            <ErrorBox message="Não foi possível carregar jogos ao vivo." />
          ) : liveEvents.length === 0 ? (
            <EmptyState
              icon="📡"
              text={selectedCountry ? `Nenhum jogo ao vivo em ${getCountryName(selectedCountry)}.` : "Nenhum jogo de futebol ao vivo neste momento."}
              subtext="Os jogos aparecem automaticamente quando começam."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {liveEvents.map((event) => (
                <LiveMatchCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SEÇÃO: PRÓXIMOS JOGOS                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-lg">📅</span>
            <h2 className="text-lg font-bold text-foreground">Próximos Jogos</h2>
            {upcomingTotal > 0 && (
              <span className="text-xs font-mono-data text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {upcomingTotal}
              </span>
            )}
          </div>

          {/* Tabs de dia + filtro país */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {futureDays.map((d) => (
              <button
                key={d.day}
                onClick={() => setUpcomingDay(d.day)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  upcomingDay === d.day
                    ? "bg-accent text-accent-foreground shadow-[0_0_12px_hsla(200,80%,55%,0.2)]"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {d.label}
              </button>
            ))}

            <span className="text-border mx-1">|</span>

            <select
              value={upcomingCountry ?? ""}
              onChange={(e) => setUpcomingCountry(e.target.value || null)}
              className="text-xs bg-secondary/60 text-foreground rounded-lg px-3 py-2 border border-border/30 outline-none focus:border-accent/40 transition-colors"
            >
              <option value="">Todos os países</option>
              {Object.entries(COUNTRY_OPTIONS).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          {upcomingLoading ? (
            <LoadingGrid count={6} />
          ) : upcomingError ? (
            <ErrorBox message="Não foi possível carregar próximos jogos." />
          ) : upcomingEvents.length === 0 ? (
            <EmptyState icon="📅" text="Nenhum jogo agendado para este dia." subtext="Selecione outro dia para ver mais jogos." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingEvents.map((event) => (
                  <UpcomingMatchCard key={event.id} event={event} />
                ))}
              </div>

              {upcomingTotal > 50 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setUpcomingPage((p) => Math.max(1, p - 1))}
                    disabled={upcomingPage <= 1}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-30 hover:bg-secondary/80"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs font-mono-data text-muted-foreground">
                    Página {upcomingPage} de {Math.ceil(upcomingTotal / 50)}
                  </span>
                  <button
                    onClick={() => setUpcomingPage((p) => p + 1)}
                    disabled={upcomingEvents.length < 50}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-30 hover:bg-secondary/80"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SEÇÃO: RESULTADOS                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-foreground">Resultados</h2>
            {endedTotal > 0 && (
              <span className="text-xs font-mono-data text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                {endedTotal}
              </span>
            )}
          </div>

          {/* Tabs de dia + filtro país */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {pastDays.map((d) => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  selectedDay === d.day
                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsla(142,72%,48%,0.2)]"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {d.label}
              </button>
            ))}

            <span className="text-border mx-1">|</span>

            <select
              value={endedCountry ?? ""}
              onChange={(e) => setEndedCountry(e.target.value || null)}
              className="text-xs bg-secondary/60 text-foreground rounded-lg px-3 py-2 border border-border/30 outline-none focus:border-primary/40 transition-colors"
            >
              <option value="">Todos os países</option>
              {Object.entries(COUNTRY_OPTIONS).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          {endedLoading ? (
            <LoadingGrid count={6} />
          ) : endedError ? (
            <ErrorBox message="Não foi possível carregar resultados." />
          ) : endedEvents.length === 0 ? (
            <EmptyState icon="📋" text="Nenhum resultado encontrado para este dia." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {endedEvents.map((event) => (
                  <EndedMatchCard key={event.id} event={event} />
                ))}
              </div>

              {endedTotal > 50 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setEndedPage((p) => Math.max(1, p - 1))}
                    disabled={endedPage <= 1}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-30 hover:bg-secondary/80"
                  >
                    ← Anterior
                  </button>
                  <span className="text-xs font-mono-data text-muted-foreground">
                    Página {endedPage} de {Math.ceil(endedTotal / 50)}
                  </span>
                  <button
                    onClick={() => setEndedPage((p) => p + 1)}
                    disabled={endedEvents.length < 50}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-secondary text-foreground disabled:opacity-30 hover:bg-secondary/80"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <ChatAssistant />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTES
// ═══════════════════════════════════════════════════════════════════════

// ─── Card de jogo AO VIVO ────────────────────────────────────────────

const LiveMatchCard = ({ event }: { event: BetsApiEvent }) => {
  const [expanded, setExpanded] = useState(false);
  const scores = event.ss?.split("-") ?? ["0", "0"];
  const timer = event.timer;
  const minute = timer ? `${timer.tm}:${String(timer.ts).padStart(2, "0")}` : null;
  const half = getHalfLabel(timer);
  const stats = event.stats;

  return (
    <div className="bg-card rounded-lg border border-primary/15 overflow-hidden shadow-[0_0_20px_hsla(142,72%,48%,0.04)] transition-all hover:border-primary/25">
      <Link
        to={`/match/${event.id}`}
        className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-secondary/10 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Flag cc={event.league.cc} />
          <span className="text-[10px] text-muted-foreground truncate">{event.league.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {half && (
            <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {half}
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-live-pulse animate-live-dot" />
          {minute && (
            <span className="text-[11px] font-bold font-mono-data text-live-pulse">{minute}'</span>
          )}
        </div>
      </Link>

      <Link to={`/match/${event.id}`} className="block px-4 py-3 hover:bg-secondary/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <TeamRow
              name={event.home.name}
              imageId={event.home.image_id}
              score={scores[0]}
              isWinner={Number(scores[0]) > Number(scores[1])}
              isLive
            />
          </div>
          <div className="text-center shrink-0 px-2">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black font-mono-data text-primary">{scores[0]}</span>
              <span className="text-lg text-muted-foreground font-light">-</span>
              <span className="text-2xl font-black font-mono-data text-primary">{scores[1]}</span>
            </div>
            {event.scores && (
              <div className="text-[9px] text-muted-foreground font-mono-data mt-0.5">
                {Object.entries(event.scores).map(([halfKey, sc]) => (
                  <span key={halfKey} className="mx-0.5">({sc.home}-{sc.away})</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <TeamRow
              name={event.away.name}
              imageId={event.away.image_id}
              score={scores[1]}
              isWinner={Number(scores[1]) > Number(scores[0])}
              isLive
              reverse
            />
          </div>
        </div>

        {stats && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <QuickStat label="Posse" home={stats.possession_rt?.[0]} away={stats.possession_rt?.[1]} suffix="%" />
            <QuickStat label="Chutes" home={stats.on_target?.[0]} away={stats.on_target?.[1]} />
            <QuickStat label="Escanteios" home={stats.corners?.[0]} away={stats.corners?.[1]} />
            {stats.xg && <QuickStat label="xG" home={stats.xg[0]} away={stats.xg[1]} />}
          </div>
        )}
      </Link>

      {stats && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-[10px] font-semibold text-primary py-1.5 border-t border-border/30 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            {expanded ? "Ocultar estatísticas ▲" : "Ver estatísticas ▼"}
          </button>
          {expanded && <StatsPanel stats={stats} />}
        </>
      )}
    </div>
  );
};

// ─── Card de jogo QUE VAI ACONTECER ──────────────────────────────────

const UpcomingMatchCard = ({ event }: { event: BetsApiEvent }) => {
  const kickoff = formatTime(event.time);
  const countdown = formatTimeUntil(event.time);

  return (
    <Link
      to={`/match/${event.id}`}
      className="block bg-card rounded-lg border border-accent/15 overflow-hidden hover:border-accent/30 hover:shadow-[0_0_16px_hsla(200,80%,55%,0.08)] transition-all"
    >
      {/* Header: Liga + Horário */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-accent/5">
        <div className="flex items-center gap-2 min-w-0">
          <Flag cc={event.league.cc} />
          <span className="text-[10px] text-muted-foreground truncate">{event.league.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
            {countdown}
          </span>
        </div>
      </div>

      {/* Times */}
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <TeamRowCompact name={event.home.name} imageId={event.home.image_id} />
          <span className="text-[10px] font-mono-data text-muted-foreground">vs</span>
          <TeamRowCompact name={event.away.name} imageId={event.away.image_id} reverse />
        </div>
      </div>

      {/* Footer: Horário */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/20 bg-secondary/10">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">⏰</span>
          <span className="text-[10px] font-semibold font-mono-data text-foreground">{kickoff}</span>
        </div>
        <span className="text-[9px] font-semibold text-accent uppercase tracking-wider">
          Agendado
        </span>
      </div>
    </Link>
  );
};

// ─── Painel de stats expandido ───────────────────────────────────────

const StatsPanel = ({ stats }: { stats: BetsApiStats }) => {
  const rows: { label: string; home: string; away: string }[] = [];

  const add = (label: string, key: keyof BetsApiStats, suffix = "") => {
    const val = stats[key];
    if (val) rows.push({ label, home: val[0] + suffix, away: val[1] + suffix });
  };

  add("Posse de bola", "possession_rt", "%");
  add("Finalizações no alvo", "on_target");
  add("Finalizações fora", "off_target");
  add("Escanteios", "corners");
  add("Ataques", "attacks");
  add("Ataques perigosos", "dangerous_attacks");
  add("xG", "xg");
  add("Passes decisivos", "key_passes");
  add("Cruzamentos", "crosses");
  add("Precisão de passe", "passing_accuracy");
  add("Precisão de cruzamento", "crossing_accuracy");
  add("Defesas", "saves");
  add("Impedimentos", "offsides");
  add("Faltas", "fouls");
  add("Chutes bloqueados", "shots_blocked");
  add("Cartões amarelos", "yellowcards");
  add("Cartões vermelhos", "redcards");
  add("Substituições", "substitutions");
  add("Lesões", "injuries");
  add("Pênaltis", "penalties");

  return (
    <div className="border-t border-border/30 bg-secondary/5">
      <div className="px-4 py-2 space-y-1">
        {rows.map((row) => (
          <StatBar key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
};

const StatBar = ({ label, home, away }: { label: string; home: string; away: string }) => {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a || 1;
  const homePercent = (h / total) * 100;

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[11px] font-mono-data text-foreground w-8 text-right shrink-0">{home}</span>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden flex">
        <div className="h-full bg-stat-bar rounded-l-full transition-all duration-700" style={{ width: `${homePercent}%` }} />
        <div className="h-full bg-stat-bar-away rounded-r-full transition-all duration-700" style={{ width: `${100 - homePercent}%` }} />
      </div>
      <span className="text-[11px] font-mono-data text-foreground w-8 shrink-0">{away}</span>
      <span className="text-[9px] text-muted-foreground w-28 truncate shrink-0">{label}</span>
    </div>
  );
};

// ─── Card de jogo ENCERRADO ──────────────────────────────────────────

const EndedMatchCard = ({ event }: { event: BetsApiEvent }) => {
  const scores = event.ss?.split("-") ?? ["0", "0"];

  return (
    <Link
      to={`/match/${event.id}`}
      className="block bg-card rounded-lg border border-border/50 overflow-hidden hover:border-primary/20 hover:shadow-[0_0_16px_hsla(142,72%,48%,0.06)] transition-all"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2 min-w-0">
          <Flag cc={event.league.cc} />
          <span className="text-[10px] text-muted-foreground truncate">{event.league.name}</span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground shrink-0">
          {formatTime(event.time)}
        </span>
      </div>

      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <TeamRowCompact name={event.home.name} imageId={event.home.image_id} />
          <span className={`text-sm font-mono-data font-bold ${Number(scores[0]) > Number(scores[1]) ? "text-foreground" : "text-muted-foreground"}`}>
            {scores[0]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <TeamRowCompact name={event.away.name} imageId={event.away.image_id} />
          <span className={`text-sm font-mono-data font-bold ${Number(scores[1]) > Number(scores[0]) ? "text-foreground" : "text-muted-foreground"}`}>
            {scores[1]}
          </span>
        </div>
      </div>

      <div className="px-3 py-1.5 border-t border-border/20 bg-secondary/10">
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Encerrado</span>
      </div>
    </Link>
  );
};

// ─── Sub-componentes reutilizáveis ───────────────────────────────────

const FilterChip = ({
  label,
  count,
  flag,
  active,
  onClick,
}: {
  label: string;
  count: number;
  flag?: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${
      active
        ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsla(142,72%,48%,0.2)]"
        : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`}
  >
    {flag && <Flag cc={flag} />}
    <span>{label}</span>
    <span className={`text-[9px] font-mono-data ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
      {count}
    </span>
  </button>
);

const Flag = ({ cc }: { cc?: string | null }) => {
  if (!cc) return null;
  return (
    <img
      src={flagUrl(cc)}
      alt=""
      className="w-3.5 h-2.5 object-cover rounded-[1px]"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
};

const TeamRow = ({
  name,
  imageId,
  score,
  isWinner,
  isLive,
  reverse,
}: {
  name: string;
  imageId?: string | null;
  score: string;
  isWinner: boolean;
  isLive?: boolean;
  reverse?: boolean;
}) => (
  <div className={`flex items-center gap-2 ${reverse ? "flex-row-reverse text-right" : ""}`}>
    <TeamLogo imageId={imageId} name={name} />
    <span className={`text-xs truncate ${isWinner ? "font-bold text-foreground" : "text-muted-foreground"}`}>
      {name}
    </span>
  </div>
);

const TeamRowCompact = ({ name, imageId, reverse }: { name: string; imageId?: string | null; reverse?: boolean }) => (
  <div className={`flex items-center gap-2 min-w-0 ${reverse ? "flex-row-reverse" : ""}`}>
    <TeamLogo imageId={imageId} name={name} size="sm" />
    <span className="text-xs text-foreground truncate">{name}</span>
  </div>
);

const TeamLogo = ({ imageId, name, size = "md" }: { imageId?: string | null; name?: string; size?: "sm" | "md" }) => {
  const s = size === "sm" ? "w-4 h-4 text-[6px]" : "w-5 h-5 text-[7px]";
  const initials = name ? name.substring(0, 2).toUpperCase() : "??";

  if (!imageId) {
    return (
      <div className={`${s} rounded bg-secondary flex items-center justify-center font-bold text-muted-foreground shrink-0`}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={teamLogoUrl(imageId)}
      alt=""
      className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} object-contain shrink-0`}
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        el.style.display = "none";
      }}
    />
  );
};

const QuickStat = ({
  label,
  home,
  away,
  suffix = "",
}: {
  label: string;
  home?: string;
  away?: string;
  suffix?: string;
}) => {
  if (!home && !away) return null;
  return (
    <div className="text-center">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono-data font-semibold text-foreground">{home ?? "-"}{suffix}</span>
        <span className="text-[9px] text-muted-foreground">-</span>
        <span className="text-[11px] font-mono-data font-semibold text-foreground">{away ?? "-"}{suffix}</span>
      </div>
      <p className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
};

// ─── Estados ─────────────────────────────────────────────────────────

const LoadingGrid = ({ count }: { count: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-lg border border-border/30 p-4 space-y-3 animate-pulse">
        <div className="h-3 bg-secondary rounded w-2/5" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-secondary rounded" />
            <div className="h-3 bg-secondary rounded flex-1" />
            <div className="w-5 h-4 bg-secondary rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-secondary rounded" />
            <div className="h-3 bg-secondary rounded flex-1" />
            <div className="w-5 h-4 bg-secondary rounded" />
          </div>
        </div>
        <div className="flex gap-4 pt-2 border-t border-border/20">
          <div className="h-3 bg-secondary rounded w-1/4" />
          <div className="h-3 bg-secondary rounded w-1/4" />
          <div className="h-3 bg-secondary rounded w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon, text, subtext }: { icon: string; text: string; subtext?: string }) => (
  <div className="bg-card/50 rounded-lg border border-border/30 p-10 text-center">
    <span className="text-3xl block mb-3">{icon}</span>
    <p className="text-sm font-medium text-foreground">{text}</p>
    {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
  </div>
);

const ErrorBox = ({ message }: { message: string }) => (
  <div className="bg-live-pulse/5 rounded-lg border border-live-pulse/20 p-6 text-center">
    <p className="text-sm font-medium text-live-pulse">{message}</p>
    <p className="text-xs text-muted-foreground mt-1">Verifique se o backend está rodando e o token da BetsAPI está configurado.</p>
  </div>
);

const COUNTRY_OPTIONS: Record<string, string> = {
  br: "🇧🇷 Brasil",
  ar: "🇦🇷 Argentina",
  mx: "🇲🇽 México",
  us: "🇺🇸 EUA",
  co: "🇨🇴 Colômbia",
  cl: "🇨🇱 Chile",
  uy: "🇺🇾 Uruguai",
  gb: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra",
  es: "🇪🇸 Espanha",
  de: "🇩🇪 Alemanha",
  it: "🇮🇹 Itália",
  fr: "🇫🇷 França",
  pt: "🇵🇹 Portugal",
  nl: "🇳🇱 Holanda",
  tr: "🇹🇷 Turquia",
  jp: "🇯🇵 Japão",
  kr: "🇰🇷 Coreia do Sul",
  au: "🇦🇺 Austrália",
};

export default Dashboard;