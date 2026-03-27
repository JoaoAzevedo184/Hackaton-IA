import { useState, useEffect, useRef } from "react";

/**
 * Incrementa o relógio do jogo localmente a cada segundo,
 * sincronizando quando novos dados chegam da API.
 *
 * Entrada:  "79:39" (mm:ss) ou "45+2" ou "90:01"
 * Saída:    "79:40", "79:41", ... tick a cada 1s
 */
export function useLiveTimer(
  apiMinute: string,
  apiHalf: string,
  isLive: boolean,
): { minute: string; half: string } {
  const parsed = useRef(parseMinute(apiMinute));
  const [totalSeconds, setTotalSeconds] = useState(() => {
    const p = parseMinute(apiMinute);
    return p.minutes * 60 + p.seconds;
  });
  const [half, setHalf] = useState(apiHalf);

  // Sync when API data changes
  useEffect(() => {
    const p = parseMinute(apiMinute);
    parsed.current = p;
    setTotalSeconds(p.minutes * 60 + p.seconds);
    setHalf(apiHalf);
  }, [apiMinute, apiHalf]);

  // Tick every second if live
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setTotalSeconds((prev) => {
        const next = prev + 1;
        const mins = Math.floor(next / 60);

        // Auto-switch half at ~45 min
        if (mins >= 45 && mins < 46 && half === "1º Tempo") {
          setHalf("Intervalo");
        }
        // Don't let it run forever past ~120 min
        if (mins > 120) return prev;

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, half]);

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;

  return { minute: display, half };
}

// ─── Parser ──────────────────────────────────────────────────────────

function parseMinute(raw: string): { minutes: number; seconds: number } {
  // Handle formats: "79:39", "45+2", "90", "HT", etc.
  if (!raw || raw === "HT" || raw === "FT") {
    return { minutes: 0, seconds: 0 };
  }

  // "45+2" → 47:00
  const addedMatch = raw.match(/^(\d+)\+(\d+)$/);
  if (addedMatch) {
    return {
      minutes: parseInt(addedMatch[1]) + parseInt(addedMatch[2]),
      seconds: 0,
    };
  }

  // "79:39" → 79 min 39 sec
  const colonMatch = raw.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    return {
      minutes: parseInt(colonMatch[1]),
      seconds: parseInt(colonMatch[2]),
    };
  }

  // "90" → 90:00
  const plain = parseInt(raw);
  if (!isNaN(plain)) {
    return { minutes: plain, seconds: 0 };
  }

  return { minutes: 0, seconds: 0 };
}