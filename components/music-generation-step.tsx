"use client";

import { useCallback, useState } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { useMutation } from "@tanstack/react-query";

import { MicrophoneRecorder } from "./microphone-recorder";

interface MusicGenerationStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function MusicGenerationStep({
  onComplete,
  onBack,
}: MusicGenerationStepProps) {
  const MOCK_AUDIO_PATH = encodeURI("/Kiedyś to było.mp3");
  const MOCK_GENERATION_DELAY_MS = 3500;

  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{
    blob: Blob;
    url: string;
    fileName: string;
  } | null>(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);

  const uploadRecordingMutation = useMutation<
    { success: boolean; message?: string },
    Error,
    { blob: Blob; fileName: string }
  >({
    mutationFn: async ({ blob, fileName }) => {
      const formData = new FormData();

      formData.append("audio", blob, fileName);

      const response = await fetch("http://localhost:8080/songs/voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorText = "Nie udało się przesłać nagrania.";

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
    onSuccess: () => {
      setIsUploadingRecording(false);
    },
    onError: (error) => {
      setIsUploadingRecording(false);
      setErrorMessage(error.message);
    },
  });

  const handleGenerate = useCallback(async () => {
    setErrorMessage(null);
    setIsGeneratingMusic(true);

    try {
      await new Promise((resolve) =>
        setTimeout(resolve, MOCK_GENERATION_DELAY_MS),
      );
      setGeneratedAudioUrl(MOCK_AUDIO_PATH);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("gifttune_music_url", MOCK_AUDIO_PATH);
      }
    } catch {
      setErrorMessage("Nie udało się wygenerować muzyki. Spróbuj ponownie.");
    } finally {
      setIsGeneratingMusic(false);
    }
  }, []);

  const handleRecordingReady = async (payload: {
    blob: Blob;
    url: string;
    fileName: string;
  }) => {
    setRecordedAudio(payload);
    setIsUploadingRecording(true);

    // Automatically upload the recording to the backend
    uploadRecordingMutation.mutate(
      { blob: payload.blob, fileName: payload.fileName },
      {
        onSuccess: () => {
          // Recording uploaded successfully
        },
      },
    );
  };

  const isLoading = isGeneratingMusic;
  const hasGenerated = generatedAudioUrl !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="neon-panel neon-panel--muted space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
            Generowanie muzyki
          </p>
          <p className="text-white/70 text-sm">
            Na podstawie rozmowy z AI i tekstu piosenki wygenerujemy dla Ciebie
            unikalną muzykę.
          </p>
        </div>

        {/* Optional: Record voice message */}
        <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 card-content space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
              Opcjonalnie: Nagraj dedykację głosową
            </p>
            <p className="text-white/70 text-sm">
              Możesz nagrać krótką wiadomość głosową, która zostanie dołączona
              do muzyki. Nagranie zostanie automatycznie przesłane do serwera.
            </p>
          </div>

          <MicrophoneRecorder onRecordingReady={handleRecordingReady} />

          {isUploadingRecording && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Spinner color="secondary" size="sm" />
              <span>Przesyłanie nagrania na serwer...</span>
            </div>
          )}

          {recordedAudio &&
            !isUploadingRecording &&
            uploadRecordingMutation.isSuccess && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-300 mb-2">
                  ✓ Nagranie zostało przesłane pomyślnie
                </p>
                <audio
                  controls
                  className="w-full rounded-xl"
                  src={recordedAudio.url}
                >
                  <track
                    default
                    kind="captions"
                    label="Transkrypcja"
                    src="data:text/vtt,WEBVTT"
                    srcLang="pl"
                  />
                  Twoja przeglądarka nie obsługuje odtwarzacza audio.
                </audio>
              </div>
            )}
        </div>

        {!hasGenerated && !isLoading && (
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 text-center card-content">
            <p className="text-white/60 text-sm mb-6">
              Kliknij poniżej, aby rozpocząć generowanie muzyki na podstawie
              Twojej rozmowy z AI.
            </p>
            <Button
              className="neon-button px-8 py-3 text-sm"
              disabled={isLoading}
              onClick={handleGenerate}
            >
              Generuj muzykę
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="rounded-[26px] border border-white/10 bg-white/5 p-8 text-center card-content">
            <Spinner className="mb-4" color="secondary" size="lg" />
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
              className="w-full rounded-2xl"
              src={generatedAudioUrl}
            >
              <track
                default
                kind="captions"
                label="Transkrypcja"
                src="data:text/vtt,WEBVTT"
                srcLang="pl"
              />
              Twoja przeglądarka nie obsługuje odtwarzacza audio.
            </audio>
            <p className="text-white/60 text-xs">
              Muzyka została wygenerowana pomyślnie. Możesz przejść do
              następnego kroku.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-[26px] border border-red-500/30 bg-red-500/10 p-4 card-content">
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </div>
        )}

        {hasGenerated && generatedAudioUrl && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 flex flex-col gap-3 card-content">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-200">
                Gotowa ścieżka
              </p>
              <p className="text-white/70 text-sm">
                Możesz pobrać wygenerowany utwór jako plik MP3.
              </p>
            </div>
            <a
              className="inline-flex items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:bg-emerald-500/25"
              download="giftune-mock-track.mp3"
              href={generatedAudioUrl}
            >
              Pobierz MP3
            </a>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
        <Button
          className="rounded-full border border-white/20 text-white/80"
          variant="light"
          onPress={onBack}
        >
          Wstecz
        </Button>
        <Button
          className="neon-button px-6 py-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!hasGenerated}
          onClick={onComplete}
        >
          Dalej: Tworzenie wideo
        </Button>
      </div>
    </div>
  );
}
