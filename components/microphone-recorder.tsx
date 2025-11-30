"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

type RecorderStatus = "idle" | "recording" | "processing" | "ready" | "error";
type PermissionStatus = "prompt" | "granted" | "denied";
type EncoderStatus = "idle" | "loading" | "ready" | "error";

interface MicrophoneRecorderProps {
  className?: string;
  onRecordingReady?: (payload: {
    blob: Blob;
    url: string;
    fileName: string;
  }) => void;
}

type LameModule = typeof import("@breezystack/lamejs");
type MediaRecorderErrorEvent = Event & { error?: DOMException };

const getSupportedMimeType = () => {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return undefined;
  }

  const preferredTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
  ];

  return preferredTypes.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });
};

const convertFloat32ToInt16 = (input: Float32Array) => {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, input[i]));

    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return output;
};

export const MicrophoneRecorder = ({
  className,
  onRecordingReady,
}: MicrophoneRecorderProps) => {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [permission, setPermission] = useState<PermissionStatus>("prompt");
  const [error, setError] = useState<string | null>(null);
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const [fileName, setFileName] = useState("gifttune-voice.mp3");
  const [encoderStatus, setEncoderStatus] = useState<EncoderStatus>("idle");
  const [mimeType, setMimeType] = useState<string | undefined>(undefined);
  const [recorderSupported, setRecorderSupported] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const lameModuleRef = useRef<LameModule | null>(null);

  const stopAndCleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      setRecorderSupported(false);

      return;
    }
    setMimeType(getSupportedMimeType());
  }, []);

  useEffect(
    () => () => {
      if (mp3Url) {
        URL.revokeObjectURL(mp3Url);
      }
      stopAndCleanupStream();
    },
    [mp3Url, stopAndCleanupStream],
  );

  const ensureEncoderModule = useCallback(async () => {
    if (lameModuleRef.current) {
      return lameModuleRef.current;
    }

    setEncoderStatus("loading");
    try {
      const lameModule = await import("@breezystack/lamejs");

      lameModuleRef.current = lameModule;
      setEncoderStatus("ready");

      return lameModule;
    } catch (encoderError) {
      console.error("Failed to load MP3 encoder", encoderError);
      setEncoderStatus("error");
      throw encoderError;
    }
  }, []);

  const convertToMp3 = useCallback(
    async (blob: Blob) => {
      const lameModule = await ensureEncoderModule();
      const { Mp3Encoder } = lameModule;

      if (!Mp3Encoder) {
        throw new Error("MP3 encoder unavailable");
      }

      const buffer = await blob.arrayBuffer();
      const AudioContextClass =
        typeof window !== "undefined"
          ? window.AudioContext ||
            (
              window as typeof window & {
                webkitAudioContext?: typeof AudioContext;
              }
            ).webkitAudioContext
          : null;

      if (!AudioContextClass) {
        throw new Error("Ta przeglądarka nie obsługuje AudioContext.");
      }

      const audioContext = new AudioContextClass();
      let audioBuffer: AudioBuffer | null = null;

      try {
        audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
      } finally {
        audioContext.close().catch(() => undefined);
      }

      if (!audioBuffer) {
        throw new Error("Nie udało się odczytać nagrania.");
      }

      const channelCount = Math.min(
        2,
        Math.max(1, audioBuffer.numberOfChannels),
      );
      const leftChannel = convertFloat32ToInt16(audioBuffer.getChannelData(0));
      const rightChannel =
        channelCount > 1
          ? convertFloat32ToInt16(audioBuffer.getChannelData(1))
          : null;

      // Create encoder with 3 parameters (as per type definition)
      // The encoder will automatically handle mono/stereo based on channelCount
      const encoder = new Mp3Encoder(channelCount, audioBuffer.sampleRate, 192);
      const blockSize = 1152;
      const mp3Chunks: Uint8Array[] = [];

      if (channelCount === 1 || !rightChannel) {
        for (let i = 0; i < leftChannel.length; i += blockSize) {
          const chunk = leftChannel.subarray(i, i + blockSize);
          const mp3buf = encoder.encodeBuffer(chunk);

          if (mp3buf.length > 0) {
            mp3Chunks.push(mp3buf);
          }
        }
      } else {
        for (let i = 0; i < leftChannel.length; i += blockSize) {
          const leftChunk = leftChannel.subarray(i, i + blockSize);
          const rightChunk = rightChannel.subarray(i, i + blockSize);
          const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);

          if (mp3buf.length > 0) {
            mp3Chunks.push(mp3buf);
          }
        }
      }

      const flushed = encoder.flush();

      if (flushed.length > 0) {
        mp3Chunks.push(flushed);
      }

      const blobParts = mp3Chunks.map((chunk) => {
        const bufferCopy = new ArrayBuffer(chunk.byteLength);

        new Uint8Array(bufferCopy).set(chunk);

        return bufferCopy;
      });

      return new Blob(blobParts, { type: "audio/mpeg" });
    },
    [ensureEncoderModule],
  );

  const handleStartRecording = useCallback(async () => {
    if (
      !recorderSupported ||
      status === "recording" ||
      status === "processing"
    ) {
      return;
    }

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setPermission("granted");
      streamRef.current = stream;

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event: MediaRecorderErrorEvent) => {
        console.error("MediaRecorder error:", event.error ?? event);
        setError("Wystąpił problem z nagrywaniem audio.");
        setStatus("error");
        stopAndCleanupStream();
      };

      recorder.onstop = async () => {
        recorderRef.current = null;
        stopAndCleanupStream();

        const rawBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        chunksRef.current = [];

        setStatus("processing");

        try {
          const mp3Blob = await convertToMp3(rawBlob);
          const finalUrl = URL.createObjectURL(mp3Blob);

          setMp3Url((previous) => {
            if (previous) {
              URL.revokeObjectURL(previous);
            }

            return finalUrl;
          });

          const generatedFileName = `gifttune-voice-${Date.now()}.mp3`;

          setFileName(generatedFileName);
          setStatus("ready");
          onRecordingReady?.({
            blob: mp3Blob,
            url: finalUrl,
            fileName: generatedFileName,
          });
        } catch (conversionError) {
          console.error("MP3 conversion failed:", conversionError);
          setError("Nie udało się przekonwertować nagrania na MP3.");
          setStatus("error");
        }
      };

      recorder.start();
      setStatus("recording");
    } catch (err) {
      console.error("Unable to access microphone", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermission("denied");
        setError("Dostęp do mikrofonu został zablokowany w przeglądarce.");
      } else {
        setError("Nie udało się uzyskać dostępu do mikrofonu.");
      }
      setStatus("error");
    }
  }, [
    convertToMp3,
    mimeType,
    onRecordingReady,
    recorderSupported,
    status,
    stopAndCleanupStream,
  ]);

  const handleStopRecording = useCallback(() => {
    if (status !== "recording" || !recorderRef.current) {
      return;
    }

    recorderRef.current.stop();
  }, [status]);

  const handleReset = useCallback(() => {
    if (recorderRef.current && status === "recording") {
      recorderRef.current.stop();
    }
    stopAndCleanupStream();
    chunksRef.current = [];
    setStatus("idle");
    setError(null);
    if (mp3Url) {
      URL.revokeObjectURL(mp3Url);
    }
    setMp3Url(null);
  }, [mp3Url, status, stopAndCleanupStream]);

  if (!recorderSupported) {
    return (
      <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
        Nagrywanie audio jest niedostępne w tej przeglądarce.
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/15 bg-white/5 px-4 py-5 backdrop-blur-xl shadow-[0_25px_75px_rgba(10,10,30,0.45)] sm:px-6 sm:py-7 card-content",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
          Nagraj dedykację
        </p>
        <p className="text-xs text-white/60">
          Złap mikrofon i nagraj krótką wiadomość. Po zatrzymaniu zapiszemy ją
          jako plik MP3.
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {permission === "denied" && (
        <p className="mt-3 text-xs text-yellow-300">
          Włącz dostęp do mikrofonu w ustawieniach przeglądarki, aby nagrywać
          dźwięk.
        </p>
      )}
      {encoderStatus === "loading" && (
        <p className="mt-3 text-xs text-white/60">
          Ładujemy enkoder MP3. Pierwsze uruchomienie może potrwać kilka sekund.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          className="min-w-[160px]"
          color={status === "recording" ? "danger" : "secondary"}
          isDisabled={status === "processing"}
          onPress={
            status === "recording" ? handleStopRecording : handleStartRecording
          }
        >
          {status === "recording"
            ? "Zatrzymaj nagrywanie"
            : "Rozpocznij nagrywanie"}
        </Button>

        <Button
          isDisabled={status === "recording"}
          variant="light"
          onPress={handleReset}
        >
          Reset
        </Button>

        {mp3Url && (
          <a
            className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 transition hover:text-white"
            download={fileName}
            href={mp3Url}
          >
            Pobierz MP3
          </a>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
        {status === "recording" && (
          <p className="text-sm text-white flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-pink-400" />
            Nagrywanie w toku...
          </p>
        )}

        {status === "processing" && (
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Spinner color="secondary" size="sm" />
            Konwertujemy nagranie do MP3...
          </div>
        )}

        {mp3Url && status === "ready" && (
          <div className="space-y-3 text-sm text-white/80">
            <p>Gotowe! Odsłuchaj lub pobierz swój plik MP3.</p>
            <audio controls className="w-full" src={mp3Url}>
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

        {!mp3Url && status !== "recording" && status !== "processing" && (
          <p className="text-sm text-white/60">
            Nagranie pojawi się tutaj po zakończeniu.
          </p>
        )}
      </div>
    </div>
  );
};
