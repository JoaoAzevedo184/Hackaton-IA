import { FC, useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Olá! 👋 Sou o assistente da **Esportes da Sorte**. Posso te ajudar com dúvidas sobre apostas, odds, mercados e estratégias. No que posso te ajudar?",
};

const ChatAssistant: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Simulated AI response for now — will be replaced with real AI
    setTimeout(() => {
      const responses = getSmartResponse(text);
      setMessages((prev) => [...prev, { role: "assistant", content: responses }]);
      setIsLoading(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-20 right-4 z-50 w-[340px] max-h-[520px] flex flex-col bg-card border border-border rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-90 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <span className="text-primary text-xs font-black">IA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Assistente de Apostas</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-live-dot" />
              <span className="text-[10px] text-muted-foreground">Online</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                }`}
              >
                <MessageContent content={msg.content} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        {messages.length <= 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {["O que é xG?", "Como funciona handicap?", "Dicas para apostar ao vivo"].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Faça sua pergunta..."
            className="flex-1 bg-secondary/60 text-sm text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 outline-none border border-transparent focus:border-primary/30 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 transition-all hover:shadow-[0_0_12px_hsla(142,72%,48%,0.3)] active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all active:scale-95 ${
          isOpen
            ? "bg-secondary text-foreground"
            : "bg-primary text-primary-foreground shadow-[0_4px_24px_hsla(142,72%,48%,0.25)]"
        }`}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
};

/** Simple bold markdown rendering */
const MessageContent: FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

/** Mock responses — will be replaced with real AI */
function getSmartResponse(input: string): string {
  const q = input.toLowerCase();

  if (q.includes("xg") || q.includes("expected goal")) {
    return "**xG (Expected Goals)** mede a qualidade das finalizações. Um xG de 0.3 significa 30% de chance de gol naquele chute. Quanto maior o xG acumulado de um time, mais chances reais de gol ele criou. É ótimo pra identificar times que criam mais do que convertem — oportunidade de aposta!";
  }
  if (q.includes("handicap")) {
    return "**Handicap Asiático** dá vantagem ou desvantagem fictícia a um time. Ex: City **-1.5** significa que o City precisa ganhar por 2+ gols pra sua aposta valer. Paga odds maiores mas exige domínio claro. A IA analisa padrões do jogo pra te dizer quando o handicap tem **valor real**.";
  }
  if (q.includes("ao vivo") || q.includes("live")) {
    return "**Apostar ao vivo** é onde a análise brilha! Dicas:\n\n• Observe os primeiros 15 min antes de apostar\n• Fique de olho no **xG** — times com xG alto sem gols tendem a converter\n• Substituições podem mudar tudo\n• Nossa IA atualiza probabilidades em **tempo real** pra te dar a melhor leitura do jogo 🎯";
  }
  if (q.includes("odd") || q.includes("odds")) {
    return "**Odds** representam a probabilidade implícita de um resultado. Odd 2.00 = 50% de chance. Quanto **maior** a odd, menos provável mas maior o retorno. A IA compara as odds do mercado com o modelo estatístico — quando a diferença é grande, temos uma **aposta de valor**! 💰";
  }
  if (q.includes("over") || q.includes("under") || q.includes("gol")) {
    return "**Over/Under** é sobre total de gols. Over 2.5 = 3+ gols na partida. Dica: olhe o histórico recente dos times. Se ambos têm média alta de gols, Over é forte. A IA calcula a probabilidade baseada em xG, posse e padrões ofensivos em **tempo real**.";
  }

  return "Boa pergunta! Posso te ajudar com:\n\n• **Odds e mercados** — como funcionam e onde está o valor\n• **Estratégias ao vivo** — quando e como apostar durante o jogo\n• **Análise de dados** — xG, posse, padrões táticos\n• **Termos de apostas** — handicap, over/under, ambas marcam\n\nSobre o que quer saber mais? 😊";
}

export default ChatAssistant;
