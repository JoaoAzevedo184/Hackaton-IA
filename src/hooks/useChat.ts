import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/types";
import { sendChatMessage } from "@/services";
import { CHAT_INITIAL_MESSAGE } from "@/constants";

const INITIAL: ChatMessage = {
  role: "assistant",
  content: CHAT_INITIAL_MESSAGE,
};

/**
 * Encapsula todo o estado e lógica do chat.
 * O componente ChatAssistant fica puramente presentacional.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(messages, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    send,
    scrollRef,
  } as const;
}
