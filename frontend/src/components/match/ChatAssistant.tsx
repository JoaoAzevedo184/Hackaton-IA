import { FC, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { CHAT_QUICK_ACTIONS } from "@/constants";

const ChatAssistant: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, setInput, isLoading, send, scrollRef } = useChat();

  return (
    <>
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSend={send}
        isLoading={isLoading}
        scrollRef={scrollRef}
      />
      <FloatingButton isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
    </>
  );
};

// ─── Painel do chat ──────────────────────────────────────────────────

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: { role: string; content: string }[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}

const ChatPanel: FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  input,
  onInputChange,
  onSend,
  isLoading,
  scrollRef,
}) => (
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
        <p className="text-sm font-semibold text-foreground">
          Assistente de Apostas
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-live-dot" />
          <span className="text-[10px] text-muted-foreground">Online</span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-95"
      >
        <X size={16} />
      </button>
    </div>

    {/* Messages */}
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0"
    >
      {messages.map((msg, i) => (
        <MessageBubble key={i} role={msg.role} content={msg.content} />
      ))}
      {isLoading && <TypingIndicator />}
    </div>

    {/* Quick actions (só na abertura) */}
    {messages.length <= 1 && (
      <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
        {CHAT_QUICK_ACTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onInputChange(q)}
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
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder="Faça sua pergunta..."
        className="flex-1 bg-secondary/60 text-sm text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 outline-none border border-transparent focus:border-primary/30 transition-colors"
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || isLoading}
        className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 transition-all hover:shadow-[0_0_12px_hsla(142,72%,48%,0.3)] active:scale-95 disabled:opacity-40 disabled:shadow-none"
      >
        <Send size={14} />
      </button>
    </div>
  </div>
);

// ─── Sub-componentes menores ─────────────────────────────────────────

const MessageBubble: FC<{ role: string; content: string }> = ({
  role,
  content,
}) => (
  <div
    className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
  >
    <div
      className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
        role === "user"
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-secondary text-secondary-foreground rounded-bl-sm"
      }`}
    >
      <FormattedText content={content} />
    </div>
  </div>
);

const TypingIndicator: FC = () => (
  <div className="flex justify-start">
    <div className="bg-secondary rounded-xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const FloatingButton: FC<{
  isOpen: boolean;
  onToggle: () => void;
}> = ({ isOpen, onToggle }) => (
  <button
    onClick={onToggle}
    className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all active:scale-95 ${
      isOpen
        ? "bg-secondary text-foreground"
        : "bg-primary text-primary-foreground shadow-[0_4px_24px_hsla(142,72%,48%,0.25)]"
    }`}
  >
    {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
  </button>
);

/** Renderiza **bold** simples em markdown */
const FormattedText: FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

export default ChatAssistant;
