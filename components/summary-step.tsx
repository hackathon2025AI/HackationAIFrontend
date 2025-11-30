"use client";

import type { ChatMessage, VideoSettings } from "@/context/project-context";

import { useEffect, useMemo, useState } from "react";

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

const SAMPLE_MUSIC_URL = encodeURI("/Kiedyś to było.mp3");
const SAMPLE_VIDEO_URL = "/sample-video.mp4";

export function SummaryStep({
  formData,
  chatHistory,
  videoData,
  onBack,
  onCreate,
  isCreating,
}: SummaryStepProps) {
  const [musicDownloadUrl, setMusicDownloadUrl] = useState<string | null>(null);
  const slideCount = videoData.libraryItems?.length ?? 0;
  const transitionType = videoData.timelineItems?.[0]?.transition || "brak";
  const hasPreviewReady = Boolean(
    videoData.timelineItems?.length && slideCount,
  );
  const duration = videoData.duration ?? slideCount * 4;
  const lastMessage = chatHistory.at(-1);
  const videoDownloadUrl = videoData.exportedVideoUrl;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("gifttune_music_url");

    setMusicDownloadUrl(stored);
  }, []);

  const resolvedMusicUrl = useMemo(
    () => musicDownloadUrl || SAMPLE_MUSIC_URL,
    [musicDownloadUrl],
  );
  const resolvedVideoUrl = videoDownloadUrl || SAMPLE_VIDEO_URL;
  const musicIsMock = !musicDownloadUrl;
  const videoIsMock = !videoDownloadUrl;

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

        <p className="text-xs text-white/60">
          Projekt: {formData.title || "Brak tytułu"} • {formData.type}
        </p>

        <div className="grid gap-4">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 card-content space-y-3">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                Ostatnia wiadomość
              </p>
              {lastMessage ? (
                <>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {lastMessage.role === "assistant" ? "GiftBeat" : "Ty"}
                  </p>
                  <p className="text-sm text-white/80 whitespace-pre-line">
                    {lastMessage.content}
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/60">
                  Brak wiadomości — rozpocznij rozmowę w poprzednim kroku.
                </p>
              )}
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                Łącznie wiadomości: {chatHistory.length}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 card-content flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                      Muzyka
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {musicIsMock ? "Przykładowy utwór" : "Gotowy utwór"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${musicIsMock ? "bg-sky-500/15 text-sky-200" : "bg-emerald-500/20 text-emerald-300"}`}
                  >
                    {musicIsMock ? "Sample" : "Gotowy"}
                  </span>
                </div>
                <p className="text-sm text-white/70 flex-1">
                  {musicIsMock
                    ? "Możesz pobrać wygenerowane MP3."
                    : "Możesz pobrać wygenerowane MP3."}
                </p>
                {resolvedMusicUrl ? (
                  <a
                    className="inline-flex items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-50 transition hover:bg-emerald-500/25"
                    download="giftune-track.mp3"
                    href={resolvedMusicUrl}
                  >
                    Pobierz MP3
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/40"
                    type="button"
                  >
                    Brak pliku
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 card-content flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                      Wideo
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {slideCount} slajdów
                    </p>
                    <p className="text-xs text-white/60">
                      Długość: ~ {duration.toFixed(1)} s
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${videoIsMock ? "bg-sky-500/15 text-sky-200" : "bg-emerald-500/20 text-emerald-300"}`}
                  >
                    {videoIsMock ? "Sample" : "Wyeksportowane"}
                  </span>
                </div>
                <div className="flex-1" />
                {resolvedVideoUrl ? (
                  <a
                    className="inline-flex items-center justify-center rounded-full border border-sky-400/60 bg-sky-500/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-50 transition hover:bg-sky-500/25"
                    download="giftune-video.mp4"
                    href={resolvedVideoUrl}
                  >
                    Pobierz wideo
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/40"
                    type="button"
                  >
                    Brak eksportu
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-white/10 pt-4">
        <button
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/50"
          disabled={isCreating}
          type="button"
          onClick={onBack}
        >
          Wróć
        </button>
      </div>
    </div>
  );
}
