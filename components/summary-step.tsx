"use client";

import type { ChatMessage, VideoSettings } from "@/context/project-context";

interface SummaryStepProps {
  formData: {
    title: string;
    description: string;
    type: string;
  };
  chatHistory: ChatMessage[];
  videoData: VideoSettings;
  onBack: () => void;
  onCreate: () => void;
  isCreating: boolean;
}

export function SummaryStep({
  formData,
  chatHistory,
  videoData,
  onBack,
  onCreate,
  isCreating,
}: SummaryStepProps) {
  const slideCount = videoData.libraryItems?.length ?? 0;
  const transitionType = videoData.timelineItems?.[0]?.transition || "brak";
  const hasPreviewReady = Boolean(
    videoData.timelineItems?.length && slideCount,
  );
  const duration = videoData.duration ?? slideCount * 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="neon-panel neon-panel--muted space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="neon-section-title">Podsumowanie projektu</p>
          <span className="text-xs text-white/60">
            {hasPreviewReady
              ? "Wszystko gotowe do utworzenia projektu"
              : "Sprawdź, czy wszystkie sekcje są uzupełnione"}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 card-content space-y-2">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Tytuł i typ
            </p>
            <p className="text-lg font-semibold text-white">
              {formData.title || "Brak tytułu"}
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-pink-200/90">
              {formData.type}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2 card-content space-y-2">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Opis
            </p>
            <p className="text-sm text-white/70 whitespace-pre-line">
              {formData.description ||
                "Brak opisu – wróć do pierwszego kroku, aby go uzupełnić."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 card-content space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                GiftTune Chat
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {chatHistory.length}
              </p>
              <p className="text-xs text-white/60">wiadomości w historii</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/60">
                Ostatnia wiadomość:
                <span className="ml-1 text-white/80">
                  {chatHistory.at(-1)?.content ||
                    "brak – rozpocznij rozmowę z AI."}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 card-content space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                  Wideo
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {slideCount} slajdów
                </p>
                <p className="text-xs text-white/60">
                  ~ {duration.toFixed(1)} s • przejście: {transitionType}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${hasPreviewReady ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-400/20 text-amber-200"}`}
              >
                {hasPreviewReady ? "Podgląd gotowy" : "Wróć do wideo"}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
              <p className="text-xs text-white/60">Ustawienia:</p>
              <ul className="text-sm text-white/80 space-y-1">
                <li>Rozdzielczość: {videoData.resolution}</li>
                <li>Klatkaż: {videoData.frameRate} fps</li>
                <li>Proporcje: {videoData.aspectRatio}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
        <button
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/50"
          disabled={isCreating}
          type="button"
          onClick={onBack}
        >
          Wstecz
        </button>
        <button
          className="neon-button px-6 py-3 text-[11px]"
          disabled={!hasPreviewReady || isCreating}
          type="button"
          onClick={onCreate}
        >
          {isCreating ? "Tworzymy projekt..." : "Create Project"}
        </button>
      </div>
    </div>
  );
}
