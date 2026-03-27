/**
 * Chama o n8n para o Edson analisar a partida e devolver
 * probabilidades, insights e recomendação via IA.
 *
 * O webhook do n8n deve retornar JSON no formato:
 * {
 *   homeWin: number,    // 0-100
 *   draw: number,       // 0-100
 *   awayWin: number,    // 0-100
 *   insights: [{ title, text, confidence, type }],
 *   recommendation: string,
 *   confidence: number  // 0-100
 * }
 */

const N8N_ANALYSIS_URL =
  import.meta.env.VITE_N8N_ANALYSIS_URL ||
  import.meta.env.VITE_N8N_WEBHOOK_URL?.replace("pergunta-do-edson", "match-analysis") ||
  "";

export interface AIAnalysisResult {
  probability: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  insights: {
    title: string;
    text: string;
    confidence: number;
    type: "probability" | "trend" | "value" | "alert";
  }[];
  recommendation: string;
  confidence: number;
}

interface MatchContext {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  half: string;
  league: string;
  stats: Record<string, unknown>;
}

export async function fetchAIAnalysis(
  context: MatchContext,
): Promise<AIAnalysisResult | null> {
  if (!N8N_ANALYSIS_URL) {
    console.warn("⚠️ VITE_N8N_ANALYSIS_URL não configurada, usando estimativas locais");
    return null;
  }

  try {
    const response = await fetch(N8N_ANALYSIS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "analyze_match",
        match: context,
        // Prompt sugerido pro Edson no n8n:
        prompt: `Analise esta partida de futebol e retorne APENAS um JSON válido:
Jogo: ${context.homeName} ${context.homeScore} x ${context.awayScore} ${context.awayName}
Liga: ${context.league}
Tempo: ${context.half} - ${context.minute}
Stats: ${JSON.stringify(context.stats)}

Retorne JSON com: homeWin (0-100), draw (0-100), awayWin (0-100), 
insights (array de {title, text, confidence 0-1, type: probability|trend|value|alert}),
recommendation (string), confidence (0-100)`,
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n retornou ${response.status}`);
    }

    const data = await response.json();

    // Tenta parsear — o n8n pode devolver direto ou dentro de "output"
    const result = data.output ? tryParseJSON(data.output) : data;

    if (result && typeof result.homeWin === "number") {
      return {
        probability: {
          homeWin: result.homeWin,
          draw: result.draw,
          awayWin: result.awayWin,
        },
        insights: result.insights ?? [],
        recommendation: result.recommendation ?? "",
        confidence: result.confidence ?? 50,
      };
    }

    // Se veio texto livre, tenta extrair JSON de dentro
    const rawText = typeof data === "string" ? data : data.output || data.text || "";
    if (typeof rawText === "string") {
      const extracted = extractJSONFromText(rawText);
      if (extracted) return extracted;
    }

    console.warn("⚠️ Resposta do n8n não está no formato esperado:", data);
    return null;
  } catch (error) {
    console.error("Erro ao buscar análise IA:", error);
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function tryParseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJSONFromText(text: string): AIAnalysisResult | null {
  // Tenta encontrar JSON dentro de ```json ... ``` ou { ... }
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    const parsed = tryParseJSON(jsonMatch[1]);
    if (parsed && typeof parsed.homeWin === "number") {
      return {
        probability: {
          homeWin: parsed.homeWin,
          draw: parsed.draw,
          awayWin: parsed.awayWin,
        },
        insights: parsed.insights ?? [],
        recommendation: parsed.recommendation ?? "",
        confidence: parsed.confidence ?? 50,
      };
    }
  }
  return null;
}