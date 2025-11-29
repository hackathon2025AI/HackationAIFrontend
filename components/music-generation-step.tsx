"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import type { ChatMessage } from "@/context/project-context";

interface MusicGenerationStepProps {
  formData: {
    title: string;
    description: string;
    type: string;
  };
  chatHistory: ChatMessage[];
  onComplete: () => void;
  onBack: () => void;
}

interface MusicGenerationResponse {
  audioUrl?: string;
  status: string;
  message?: string;
}

export function MusicGenerationStep({
  formData,
  chatHistory,
  onComplete,
  onBack,
}: MusicGenerationStepProps) {
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const musicGenerationMutation = useMutation<MusicGenerationResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch("http://localhost:8080/songs/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Include any necessary data for music generation
        }),
      });

      if (!response.ok) {
        let errorText = "Nie udało się wygenerować muzyki.";
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
    onSuccess: (data) => {
      if (data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.message || "Nie udało się wygenerować muzyki.");
      }
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleGenerate = () => {
    setErrorMessage(null);
    musicGenerationMutation.mutate();
  };

  const isLoading = musicGenerationMutation.isPending;
  const hasGenerated = generatedAudioUrl !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="neon-panel neon-panel--muted space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            Generowanie muzyki
          </p>
          <p className="text-white/70 text-sm">
            Na podstawie rozmowy z AI i tekstu piosenki wygenerujemy dla Ciebie unikalną muzykę.
          </p>
        </div>

        {!hasGenerated && !isLoading && (
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 text-center card-content">
            <p className="text-white/60 text-sm mb-6">
              Kliknij poniżej, aby rozpocząć generowanie muzyki na podstawie Twojej rozmowy z AI.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="neon-button px-8 py-3 text-sm"
            >
              Generuj muzykę
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 text-center card-content">
            <Spinner size="lg" color="secondary" className="mb-4" />
            <p className="text-white/70 text-sm">
              Generowanie muzyki... To może chwilę potrwać.
            </p>
          </div>
        )}

        {hasGenerated && generatedAudioUrl && (
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 card-content space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
                Wygenerowana muzyka
              </p>
              <span className="text-xs text-emerald-300 font-semibold uppercase">
                Gotowe
              </span>
            </div>
            <audio
              controls
              src={generatedAudioUrl}
              className="w-full rounded-2xl"
            >
              Twoja przeglądarka nie obsługuje odtwarzacza audio.
            </audio>
            <p className="text-white/60 text-xs">
              Muzyka została wygenerowana pomyślnie. Możesz przejść do następnego kroku.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-[26px] border border-red-500/30 bg-red-500/10 p-4 card-content">
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 card-content">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Tytuł projektu</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formData.title || "Brak tytułu"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 card-content">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Chat</p>
            <p className="mt-2 text-2xl font-semibold text-white">{chatHistory.length}</p>
            <p className="text-xs text-white/60">wiadomości wymienione</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
        <Button
          variant="light"
          className="rounded-full border border-white/20 text-white/80"
          onPress={onBack}
        >
          Wstecz
        </Button>
        <Button
          onClick={onComplete}
          disabled={!hasGenerated}
          className="neon-button px-6 py-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Dalej: Tworzenie wideo
        </Button>
      </div>
    </div>
  );
}

