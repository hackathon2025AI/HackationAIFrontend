"use client";

import { useState } from "react";
import clsx from "clsx";
import { VideoEditor } from "./video-editor";
import type {
  ChatMessage,
  VideoSettings,
  SerializedLibraryItem,
  SerializedTimelineItem,
} from "@/context/project-context";

interface VideoEditorStepProps {
  formData: {
    title: string;
    description: string;
    type: string;
  };
  chatHistory: ChatMessage[];
  videoData: VideoSettings;
  onVideoUpdate: (data: Partial<VideoSettings>) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function VideoEditorStep({
  formData,
  chatHistory,
  videoData,
  onVideoUpdate,
  onComplete,
  onBack,
}: VideoEditorStepProps) {
  const resolutionOptions = ["720p", "1080p", "1440p", "4K"];
  const frameRateOptions = [24, 30, 48, 60];
  const aspectRatioOptions = ["16:9", "9:16", "1:1", "4:3"];

  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    duration: 30,
    resolution: "1080p",
    frameRate: 30,
    aspectRatio: "16:9",
    timelineItems: [],
    libraryItems: [],
    ...videoData,
  });

  const handleSettingChange = (key: string, value: any) => {
    const updated = { ...videoSettings, [key]: value };
    setVideoSettings(updated);
    onVideoUpdate(updated);
  };

  const handleVideoExport = (videoBlob: Blob) => {
    // Store the exported video blob URL in videoData
    const videoUrl = URL.createObjectURL(videoBlob);
    const updatedVideoData = {
      ...videoSettings,
      exportedVideoUrl: videoUrl,
      exportedVideoBlob: videoBlob,
    };
    onVideoUpdate(updatedVideoData);
  };

  const handleMediaUpdate = (
    timelineItems: SerializedTimelineItem[],
    libraryItems: Array<SerializedLibraryItem & { file?: File }>
  ) => {
    const serializedTimeline = timelineItems.map((item) => ({
      id: item.id,
      libraryItemId: item.libraryItemId,
      duration: item.duration,
      startTime: item.startTime,
      transition: item.transition,
      transitionDuration: item.transitionDuration,
    }));

    const serializedLibrary = libraryItems.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      duration: item.duration,
      fileName: item.file?.name || item.fileName,
    }));

    const updatedVideoData: VideoSettings = {
      ...videoSettings,
      timelineItems: serializedTimeline,
      libraryItems: serializedLibrary,
    };

    setVideoSettings(updatedVideoData);
    onVideoUpdate(updatedVideoData);
  };

  return (
    <div className="flex flex-col gap-6">
      <VideoEditor
        onExport={handleVideoExport}
        onUpdate={handleMediaUpdate}
        initialLibraryItems={videoData?.libraryItems}
        initialTimelineItems={videoData?.timelineItems}
      />

      <div className="neon-panel neon-panel--muted space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="neon-section-title">Eksport & ustawienia</p>
          <span className="text-xs text-white/60">
            {videoSettings.resolution} • {videoSettings.aspectRatio}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">Rozdzielczość</p>
            <div className="flex flex-wrap gap-2">
              {resolutionOptions.map((res) => (
                <button
                  key={res}
                  type="button"
                  className={clsx("option-pill", videoSettings.resolution === res && "is-active")}
                  onClick={() => handleSettingChange("resolution", res)}
                >
                  {res}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Proporcje obrazu
            </p>
            <div className="flex flex-wrap gap-2">
              {aspectRatioOptions.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  className={clsx("option-pill", videoSettings.aspectRatio === ratio && "is-active")}
                  onClick={() => handleSettingChange("aspectRatio", ratio)}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">Frame rate</p>
            <div className="flex flex-wrap gap-2">
              {frameRateOptions.map((fps) => (
                <button
                  key={fps}
                  type="button"
                  className={clsx("option-pill", videoSettings.frameRate === fps && "is-active")}
                  onClick={() => handleSettingChange("frameRate", fps)}
                >
                  {fps} fps
                </button>
              ))}
            </div>
          </section>

        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Tytuł</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formData.title || "Brak tytułu"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Opis</p>
            <p className="mt-2 text-sm text-white/70 whitespace-pre-line">
              {formData.description || "Brak opisu – możesz dodać go na wcześniejszym etapie."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Chat</p>
            <p className="mt-2 text-2xl font-semibold text-white">{chatHistory.length}</p>
            <p className="text-xs text-white/60">wiadomości wymienione</p>
          </div>
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
          onClick={() => {
            console.log("[GiftTune] Creating project with video settings:", {
              formData,
              chatHistory,
              videoData: { ...videoSettings },
            });
            onComplete();
          }}
          className="neon-button px-6 py-3 text-[11px]"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}

