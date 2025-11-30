"use client";

import type { ChatMessage } from "@/context/project-context";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "@tanstack/react-query";

import { useProject } from "@/context/project-context";

type Option = {
  value: string;
  label: string;
  icon?: string;
  variant?: "ghost";
};

const OCCASION_OPTIONS: Option[] = [
  { value: "birthday", label: "Urodziny", icon: "🎂" },
  { value: "anniversary", label: "Rocznica / Związek", icon: "💍" },
  { value: "christmas", label: "Święta", icon: "🎄" },
  { value: "roast", label: "Roast", icon: "😂" },
  { value: "other", label: "Inna okazja", icon: "✨", variant: "ghost" },
];

const RELATION_OPTIONS: Option[] = [
  { value: "partner", label: "Partner / Partnerka", icon: "❤️" },
  { value: "friend", label: "Przyjaciel / Przyjaciółka", icon: "🧸" },
  { value: "parents", label: "Mama / Tata", icon: "👪" },
  { value: "grandparents", label: "Babcia / Dziadek", icon: "👴" },
  { value: "child", label: "Dziecko", icon: "👶" },
  { value: "work", label: "Szef / Współpracownik", icon: "💼" },
  { value: "custom", label: "Inna relacja", icon: "✏️", variant: "ghost" },
];

const VIBE_OPTIONS: Option[] = [
  { value: "rock", label: "Rock / Metal", icon: "🎸" },
  { value: "pop", label: "Pop / Radio Hit", icon: "🎤" },
  { value: "rap", label: "Rap / Hip-hop", icon: "🧢" },
  { value: "jazz", label: "Jazz / Blues", icon: "🎹" },
  { value: "edm", label: "EDM / Klubowa", icon: "🎛️" },
  { value: "classical", label: "Muzyka Filmowa / Klasyczna", icon: "🎻" },
  { value: "country", label: "Country / Folk", icon: "🤠" },
  { value: "custom", label: "Inny styl", icon: "➕", variant: "ghost" },
];

interface OptionGroupProps {
  index: number;
  title: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  subtitle?: string;
  customValueKey?: string;
  customInputPlaceholder?: string;
  customInputValue?: string;
  onCustomInputChange?: (value: string) => void;
}

interface SongStartPayload {
  title: string;
  genre: string;
  mood: string;
  tempo: string;
  language: string;
  perspective: string;
  additional_notes: string;
}

interface SongStartResponse {
  reply: string;
  lyrics: string | null;
  lyrics_changed: boolean;
}

const OptionGroup = ({
  index,
  title,
  subtitle,
  options,
  value,
  onChange,
  customValueKey,
  customInputPlaceholder,
  customInputValue,
  onCustomInputChange,
}: OptionGroupProps) => (
  <div className="space-y-4">
    <div>
      <p className="neon-section-title">
        {index}. {title}
      </p>
      {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          className={clsx(
            "option-pill",
            option.variant === "ghost" && "option-pill--ghost",
            value === option.value && "is-active",
          )}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.icon && <span className="text-lg">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
    {value === customValueKey &&
      customInputPlaceholder &&
      onCustomInputChange && (
        <input
          className="neon-input"
          placeholder={customInputPlaceholder}
          type="text"
          value={customInputValue}
          onChange={(event) => onCustomInputChange(event.target.value)}
        />
      )}
  </div>
);

export default function Home() {
  const router = useRouter();
  const { data, setStartData, setChatHistory } = useProject();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const occasion = data.start.occasion;
  const occasionCustomDetail = data.start.occasionCustomDetail ?? "";
  const relation = data.start.relation;
  const relationCustomDetail = data.start.relationCustomDetail ?? "";
  const vibe = data.start.vibe;
  const vibeCustomDetail = data.start.vibeCustomDetail ?? "";
  const recipientName = data.start.recipientName;

  const setOccasion = (v: string) => setStartData({ occasion: v });
  const setOccasionCustomDetail = (v: string) =>
    setStartData({ occasionCustomDetail: v || null });
  const setRelation = (v: string) => setStartData({ relation: v });
  const setRelationCustomDetail = (v: string) =>
    setStartData({ relationCustomDetail: v || null });
  const setVibe = (v: string) => setStartData({ vibe: v });
  const setVibeCustomDetail = (v: string) =>
    setStartData({ vibeCustomDetail: v || null });
  const setRecipientName = (v: string) => setStartData({ recipientName: v });

  const createSongMutation = useMutation<
    SongStartResponse,
    Error,
    SongStartPayload
  >({
    mutationFn: async (payload) => {
      const response = await fetch("http://localhost:8080/songs/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Nie udało się rozpocząć tworzenia utworu.";

        try {
          const errorData = await response.json();

          if (typeof errorData?.message === "string") {
            message = errorData.message;
          }
        } catch {
          // ignore json parsing errors
        }
        throw new Error(message);
      }

      const responseBody: SongStartResponse = await response.json();

      return responseBody;
    },
    onSuccess: (responseBody, variables) => {
      setSubmissionError(null);
      const summaryLines = [
        "🎁 Rozpoczęto tworzenie utworu z następującymi parametrami:",
        `• Title: ${variables.title}`,
        `• Genre: ${variables.genre}`,
        `• Mood: ${variables.mood}`,
        `• Tempo: ${variables.tempo}`,
        `• Perspective: ${variables.perspective}`,
        `• Language: ${variables.language}`,
        `• Notes: ${variables.additional_notes}`,
      ];

      const userMessage: ChatMessage = {
        role: "user",
        content: summaryLines.join("\n"),
        timestamp: new Date(),
      };

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          responseBody.reply ??
          "Mam gotową odpowiedź dotyczącą Twojego prezentu.",
        timestamp: new Date(),
      };

      const conversation = [userMessage, assistantMessage];

      setChatHistory(conversation);

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            "gifttune:lastSongStart",
            JSON.stringify({
              payload: variables,
              response: responseBody,
              timestamp: new Date().toISOString(),
            }),
          );
        } catch {
          // ignore storage errors
        }
      }

      router.push("/project/create?step=chat");
    },
    onError: (error: unknown) => {
      setSubmissionError(
        error instanceof Error ? error.message : "Wystąpił nieznany błąd.",
      );
    },
  });

  const buildSongPayload = (): SongStartPayload => {
    const normalizedOccasion =
      occasion === "other" ? occasionCustomDetail || occasion : occasion;
    const normalizedRelation =
      relation === "custom" ? relationCustomDetail || relation : relation;
    const normalizedVibe = vibe === "custom" ? vibeCustomDetail || vibe : vibe;

    const notes: string[] = [];

    if (recipientName) {
      notes.push(`Recipient: ${recipientName}`);
    }
    if (occasion === "other" && occasionCustomDetail) {
      notes.push(`Occasion detail: ${occasionCustomDetail}`);
    }
    if (relation === "custom" && relationCustomDetail) {
      notes.push(`Relation detail: ${relationCustomDetail}`);
    }
    if (vibe === "custom" && vibeCustomDetail) {
      notes.push(`Preferred vibe detail: ${vibeCustomDetail}`);
    }

    return {
      title: "",
      genre: normalizedVibe,
      mood: normalizedOccasion,
      tempo: "",
      language: "en",
      perspective: normalizedRelation,
      additional_notes: "",
    };
  };

  return (
    <section className="relative min-h-[calc(100vh-6rem)] w-full px-4 py-12 md:px-8 md:py-4">
      <div className="mx-auto max-w-4xl xl:max-w-6xl">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0c0022]/85 via-[#050015]/92 to-[#080024]/90 p-6 sm:p-10 shadow-[0_45px_140px_rgba(90,9,146,0.55)]">
          <div className="absolute -top-32 -left-10 h-72 w-72 blurred-spot bg-[#ff4bd8]" />
          <div className="absolute -bottom-20 -right-10 h-64 w-64 blurred-spot bg-[#5a7bff]" />

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.45em] text-white/60">
              <span className="rounded-full border border-white/30 px-4 py-1 text-white/80">
                GiftTune
              </span>
              <span className="rounded-full border border-pink-400/60 px-3 py-1 text-pink-200">
                AI
              </span>
              <span>Personalizowane utwory</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gradient sm:text-5xl">
                Stwórz Hit dla Bliskiej Osoby
              </h1>
              <p className="text-lg text-white/75 max-w-2xl">
                Wybierz okazję, dodaj imię i pozwól GiftTune.ai zaskoczyć Twoich
                najbliższych personalizowaną piosenką.
              </p>
            </div>

            <div className="neon-panel flex flex-col gap-8">
              <OptionGroup
                customInputPlaceholder="Opisz okazję, np. Wieczór panieński..."
                customInputValue={occasionCustomDetail}
                customValueKey="other"
                index={1}
                options={OCCASION_OPTIONS}
                title="Okazja?"
                value={occasion}
                onChange={setOccasion}
                onCustomInputChange={setOccasionCustomDetail}
              />

              <div className="glow-divider" />

              <div className="space-y-4">
                <p className="neon-section-title">2. Dla kogo?</p>
                <div className="flex flex-col gap-3">
                  <input
                    className="neon-input"
                    placeholder="Wpisz imię..."
                    type="text"
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-3">
                    {RELATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={clsx(
                          "option-pill",
                          option.variant === "ghost" && "option-pill--ghost",
                          relation === option.value && "is-active",
                        )}
                        type="button"
                        onClick={() => setRelation(option.value)}
                      >
                        {option.icon && (
                          <span className="text-lg">{option.icon}</span>
                        )}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                  {relation === "custom" && (
                    <input
                      className="neon-input"
                      placeholder="Opisz relację, np. Kuzynka, Drużba..."
                      type="text"
                      value={relationCustomDetail}
                      onChange={(event) =>
                        setRelationCustomDetail(event.target.value)
                      }
                    />
                  )}
                </div>
              </div>

              <div className="glow-divider" />

              <OptionGroup
                customInputPlaceholder="Opisz styl, np. Szanta, Opera, Disco Polo..."
                customInputValue={vibeCustomDetail}
                customValueKey="custom"
                index={3}
                options={VIBE_OPTIONS}
                subtitle="Jak ma brzmieć Wasz hit?"
                title="Vibe muzyczny?"
                value={vibe}
                onChange={setVibe}
                onCustomInputChange={setVibeCustomDetail}
              />

              <button
                className="neon-button w-full justify-center text-sm"
                disabled={createSongMutation.isPending}
                type="button"
                onClick={() => createSongMutation.mutate(buildSongPayload())}
              >
                {createSongMutation.isPending ? "Wysyłanie..." : "Dalej"}
              </button>

              {submissionError && (
                <p className="text-sm text-red-300">{submissionError}</p>
              )}
            </div>
          </div>

          <div className="absolute right-8 top-8 hidden sm:block">
            <div className="relative rounded-3xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold tracking-[0.6em] text-white">
              AI
              <span
                className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,75,216,0.45), transparent 60%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {createSongMutation.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/10 px-8 py-10 text-white shadow-2xl">
            <Spinner color="secondary" size="lg" />
            <p className="text-sm uppercase tracking-[0.4em] text-white/70">
              Tworzymy zapytanie
            </p>
            <p className="text-xs text-white/60 text-center">
              Prosimy o chwilę cierpliwości. Przygotowujemy szczegóły Twojego
              utworu.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
