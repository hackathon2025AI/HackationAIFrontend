"use client";

import type { HTMLAttributes } from "react";
import type { Components as MarkdownComponents } from "react-markdown";
import type { ChatMessage } from "@/context/project-context";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@heroui/input";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";

const markdownComponents: MarkdownComponents = {
  p: ({ node, ...props }) => (
    <p {...props} className="mb-2 last:mb-0 leading-relaxed" />
  ),
  ul: ({ node, ...props }) => (
    <ul
      {...props}
      className="mb-2 ml-5 list-disc space-y-1 text-sm last:mb-0"
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      {...props}
      className="mb-2 ml-5 list-decimal space-y-1 text-sm last:mb-0"
    />
  ),
  strong: ({ node, ...props }) => (
    <strong {...props} className="font-semibold" />
  ),
  em: ({ node, ...props }) => <em {...props} className="italic" />,
  code: ({
    inline,
    ...props
  }: { inline?: boolean } & HTMLAttributes<HTMLElement>) =>
    inline ? (
      <code
        {...props}
        className="rounded bg-black/20 px-1 py-0.5 text-[0.8em]"
      />
    ) : (
      <code
        {...props}
        className="block rounded-xl bg-black/30 px-3 py-2 text-[0.85em]"
      />
    ),
};

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

interface ChatApiResponse {
  reply: string;
  lyrics: string | null;
  lyrics_changed: boolean;
}

export function ChatStep({
  formData,
  chatHistory,
  onChatUpdate,
  onComplete,
  onBack,
}: ChatStepProps) {
  const [input, setInput] = useState("");
  const [lyricsDraft, setLyricsDraft] = useState<string>("");
  const [isLyricsAvailable, setIsLyricsAvailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lyricsStatus, setLyricsStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
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
  }, []);

  const chatMutation = useMutation<ChatApiResponse, Error, { message: string }>(
    {
      mutationFn: async ({ message }) => {
        const response = await fetch("http://localhost:8080/songs/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            edited_lyrics: lyricsDraft || "",
          }),
        });

        if (!response.ok) {
          let errorText = "Nie udało się wysłać wiadomości.";

          try {
            const errorData = await response.json();

            if (typeof errorData?.message === "string") {
              errorText = errorData.message;
            }
          } catch {
            // ignore json parse error
          }
          throw new Error(errorText);
        }

        return response.json();
      },
    },
  );

  const saveLyricsMutation = useMutation<{ lyrics: string }, Error, string>({
    mutationFn: async (lyrics) => {
      const response = await fetch("http://localhost:8080/songs/lyrics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lyrics }),
      });

      if (!response.ok) {
        let errorText = "Nie udało się zapisać tekstu.";

        try {
          const errorData = await response.json();

          if (typeof errorData?.message === "string") {
            errorText = errorData.message;
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setLyricsDraft(data.lyrics ?? lyricsDraft);
      setLyricsStatus({ type: "success", message: "Tekst został zapisany." });
    },
    onError: (error) => {
      setLyricsStatus({ type: "error", message: error.message });
    },
  });

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedHistory = [...chatHistory, userMessage];

    onChatUpdate(updatedHistory);
    setInput("");

    chatMutation.mutate(
      { message: userMessage.content },
      {
        onSuccess: (data) => {
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content:
              data.reply ?? "Mam gotową odpowiedź dotyczącą Twojego prezentu.",
            timestamp: new Date(),
          };

          onChatUpdate([...updatedHistory, assistantMessage]);
          if (typeof data.lyrics === "string") {
            setLyricsDraft(data.lyrics);
            setIsLyricsAvailable(true);
            setLyricsStatus(null);
          } else if (data.lyrics === null) {
            setIsLyricsAvailable(false);
          }
        },
        onError: (error) => {
          setErrorMessage(error.message);
        },
      },
    );
  };

  const isLoading = chatMutation.isPending;
  const isSavingLyrics = saveLyricsMutation.isPending;

  const handleSaveLyrics = () => {
    if (!lyricsDraft.trim()) {
      setLyricsStatus({ type: "error", message: "Tekst nie może być pusty." });

      return;
    }
    setLyricsStatus(null);
    saveLyricsMutation.mutate(lyricsDraft);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="neon-panel neon-panel--muted flex min-h-[600px] flex-col gap-6 overflow-hidden">
      <div
        className={clsx(
          "grid grid-cols-1 gap-6 flex-1 lg:overflow-hidden",
          isLyricsAvailable ? "lg:grid-cols-8" : "lg:grid-cols-1",
        )}
      >
        {/* Lyrics Column */}
        {isLyricsAvailable && (
          <div className="lg:col-span-2 rounded-[26px] border border-white/10 bg-white/5 px-5 py-4 text-white shadow-[0_15px_40px_rgba(5,0,20,0.35)] flex h-[460px] flex-col overflow-hidden card-content">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                Tekst piosenki
              </p>
              {lyricsStatus && (
                <span
                  className={clsx(
                    "text-[11px] font-semibold uppercase",
                    lyricsStatus.type === "success"
                      ? "text-emerald-300"
                      : "text-red-300",
                  )}
                >
                  {lyricsStatus.message}
                </span>
              )}
            </div>
            <ScrollShadow className="mt-3 flex-1 overflow-y-auto pr-1">
              <textarea
                className="min-h-[20rem] w-full rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                placeholder="Tekst będzie dostępny po odpowiedzi AI..."
                value={lyricsDraft}
                onChange={(event) => {
                  setLyricsDraft(event.target.value);
                  setLyricsStatus(null);
                }}
              />
            </ScrollShadow>
            <button
              className="neon-button mt-3 w-full justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSavingLyrics}
              type="button"
              onClick={handleSaveLyrics}
            >
              {isSavingLyrics ? "Zapisywanie..." : "Zapisz tekst"}
            </button>
          </div>
        )}

        {/* Chat Messages Column */}
        <div
          className={clsx(
            "rounded-[26px] border border-white/10 bg-white/5 px-5 py-6 backdrop-blur flex h-[460px] flex-col overflow-hidden card-content",
            isLyricsAvailable ? "lg:col-span-6" : "lg:col-span-1",
          )}
        >
          <ScrollShadow
            ref={scrollContainerRef}
            className={clsx("flex-1 overflow-y-auto mb-4")}
          >
            <div className="flex flex-col gap-4">
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={clsx(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-[0_18px_35px_rgba(7,1,30,0.45)] transition",
                      message.role === "user"
                        ? "bg-gradient-to-r from-[#ff4bd8]/80 to-[#7b5dff]/85 text-white"
                        : "border border-white/12 bg-white/5 text-white/90",
                    )}
                  >
                    <div
                      className={clsx(
                        "chat-markdown prose prose-invert max-w-none text-sm",
                        message.role === "user"
                          ? "[&_*]:text-white"
                          : "[&_*]:text-white/90",
                      )}
                    >
                      <ReactMarkdown components={markdownComponents}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
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
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/70 card-content">
                    <Spinner color="secondary" size="sm" />
                    <span className="text-sm">GiftTune.ai pisze...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollShadow>

          {/* Input Area - Inside Chat Column */}
          <div className="space-y-2 border-t border-white/10 pt-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Twoja wiadomość
            </p>
            <div className="flex gap-3">
              <Input
                classNames={{
                  base: "flex-1",
                  inputWrapper:
                    "bg-white/5 border border-white/15 rounded-2xl px-3 py-2 shadow-[0_15px_30px_rgba(5,0,20,0.4)] data-[disabled=true]:opacity-60",
                  input: "text-sm text-white placeholder:text-white/50 pr-2",
                }}
                disabled={isLoading}
                placeholder="Type your message..."
                value={input}
                variant="bordered"
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="neon-button px-6 py-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!input.trim() || isLoading}
                type="button"
                onClick={handleSend}
              >
                Wyślij
              </button>
            </div>
            {errorMessage && (
              <p className="text-sm text-red-300">{errorMessage}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
        <button
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/50"
          type="button"
          onClick={onBack}
        >
          Wstecz
        </button>
        <button
          className="neon-button px-6 py-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!isLyricsAvailable || !lyricsDraft.trim()}
          type="button"
          onClick={onComplete}
        >
          Dalej: Generowanie muzyki
        </button>
      </div>
    </div>
  );
}
