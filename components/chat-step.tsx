"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@heroui/input";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spinner } from "@heroui/spinner";
import clsx from "clsx";
import type { ChatMessage } from "@/context/project-context";

interface ChatStepProps {
  formData: {
    title: string;
    description: string;
    type: string;
  };
  chatHistory: ChatMessage[];
  onChatUpdate: (history: ChatMessage[]) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function ChatStep({
  formData,
  chatHistory,
  onChatUpdate,
  onComplete,
  onBack,
}: ChatStepProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Initialize with a welcome message if chat is empty
  useEffect(() => {
    if (chatHistory.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: `Hello! I'm here to help you with your project "${formData.title}". ${formData.description ? `I see you want to: ${formData.description}` : "How can I assist you today?"}`,
        timestamp: new Date(),
      };
      onChatUpdate([welcomeMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedHistory = [...chatHistory, userMessage];
    onChatUpdate(updatedHistory);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: `I understand you're asking about "${userMessage.content}". Let me help you with that. This is a simulated response - in a real application, this would connect to an AI service like OpenAI or similar.`,
        timestamp: new Date(),
      };
      onChatUpdate([...updatedHistory, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="neon-panel neon-panel--muted flex h-[600px] flex-col gap-6">
      {/* Chat Messages */}
      <ScrollShadow
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto rounded-[26px] border border-white/10 bg-white/5 px-5 py-6 backdrop-blur"
      >
        <div className="flex flex-col gap-4">
          {chatHistory.map((message, index) => (
            <div key={index} className={clsx("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={clsx(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-[0_18px_35px_rgba(7,1,30,0.45)] transition",
                  message.role === "user"
                    ? "bg-gradient-to-r from-[#ff4bd8]/80 to-[#7b5dff]/85 text-white"
                    : "border border-white/12 bg-white/5 text-white/90"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                {message.timestamp && (
                  <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-white/60">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/70">
                <Spinner size="sm" color="secondary" />
                <span className="text-sm">GiftTune.ai pisze...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollShadow>

      {/* Input Area */}
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Twoja wiadomość</p>
        <div className="flex gap-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          variant="bordered"
          disabled={isLoading}
          classNames={{
            base: "flex-1",
            inputWrapper:
              "bg-white/5 border border-white/15 rounded-2xl px-3 py-2 shadow-[0_15px_30px_rgba(5,0,20,0.4)] data-[disabled=true]:opacity-60",
            input: "text-sm text-white placeholder:text-white/50 pr-2",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="neon-button px-6 py-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Wyślij
        </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/50"
        >
          Wstecz
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={chatHistory.length < 2}
          className="neon-button px-6 py-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Video Editor
        </button>
      </div>
    </div>
  );
}

