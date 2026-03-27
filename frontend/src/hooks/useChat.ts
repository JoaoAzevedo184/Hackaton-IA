import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/types";

// ─── n8n Webhook URL ─────────────────────────────────────────────────
// Em produção, mover para .env como VITE_N8N_WEBHOOK_URL
const N8N_WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ||
  "https://resistant-nose-cheats-ripe.trycloudflare.com/webhook-test/pergunta-do-edson";

const INITIAL: ChatMessage = {
  role: "assistant",
  content:
    "Haja coração, amigo! O Edson chegou! Como posso te ajudar com os palpites hoje?",
};

/**
 * Hook de chat conectado ao n8n via webhook.
 * Envia a pergunta do usuário pro workflow do n8n
 * e recebe a resposta do agente IA (Edson).
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Session ID único por sessão do browser (memória do n8n)
  const [sessionId] = useState(
    () => `session_${Math.random().toString(36).substring(2, 11)}`,
  );

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: text,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n retornou ${response.status}`);
      }

      const data = await response.json();

      // O n8n pode devolver o campo como "output", "resposta", ou "text"
      const aiResponse =
        data.output ||
        data.resposta ||
        data.text ||
        data.message ||
        "Ih, rapaz! O VAR tá analisando, deu erro na resposta.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    } catch (error) {
      console.error("Erro no chat com n8n:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Haja coração! Tivemos um problema técnico na transmissão. Tenta de novo, craque!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    send,
    scrollRef,
  } as const;
}