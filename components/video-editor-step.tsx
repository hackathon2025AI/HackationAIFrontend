"use client";

import { useState } from "react";
import clsx from "clsx";
import { VideoEditor } from "./video-editor";

interface VideoEditorStepProps {
  formData: {
    title: string;
    description: string;
    type: string;
  };
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  videoData: any;
  onVideoUpdate: (data: any) => void;
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
  const aspectRatioOptions = ["16:9", "9:16", "1:1", "4:3"];

  const [videoSettings, setVideoSettings] = useState({
    duration: 30,
    resolution: "1080p",
    frameRate: 30,
    aspectRatio: "16:9",
    enableTransitions: true,
    enableMusic: false,
    volume: 50,
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

  const handleMediaUpdate = (timelineItems: any[], libraryItems: any[]) => {
    // Update video data with timeline and library items
    const updatedVideoData = {
      ...videoSettings,
      timelineItems: timelineItems.map((item) => ({
        id: item.id,
        libraryItemId: item.libraryItemId,
        duration: item.duration,
        startTime: item.startTime,
      })),
      libraryItems: libraryItems.map((item) => ({
        id: item.id,
        type: item.type,
        fileName: item.file.name,
        duration: item.duration,
      })),
    };
    onVideoUpdate(updatedVideoData);
  };

  return (
    <div className="flex flex-col gap-6">
      <VideoEditor onExport={handleVideoExport} onUpdate={handleMediaUpdate} />

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
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Frame rate
            </p>
            <p className="text-sm text-white/70">Aktualnie: {videoSettings.frameRate} fps</p>
            <input
              type="range"
              min={24}
              max={60}
              step={6}
              value={videoSettings.frameRate}
              onChange={(e) => handleSettingChange("frameRate", parseInt(e.target.value))}
              className="w-full accent-pink-400"
            />
            <div className="flex justify-between text-[11px] uppercase tracking-[0.35em] text-white/40">
              <span>24fps</span>
              <span>60fps</span>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">Efekty</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={clsx("option-pill", videoSettings.enableTransitions && "is-active")}
                onClick={() => handleSettingChange("enableTransitions", !videoSettings.enableTransitions)}
              >
                Przejścia
              </button>
              <button
                type="button"
                className={clsx("option-pill", videoSettings.enableMusic && "is-active")}
                onClick={() => handleSettingChange("enableMusic", !videoSettings.enableMusic)}
              >
                Muzyka
              </button>
            </div>
            {videoSettings.enableMusic && (
              <div className="space-y-2">
                <p className="text-sm text-white/70">Głośność: {videoSettings.volume}%</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={videoSettings.volume}
                  onChange={(e) => handleSettingChange("volume", parseInt(e.target.value))}
                  className="w-full accent-indigo-400"
                />
                <div className="flex justify-between text-[11px] uppercase tracking-[0.35em] text-white/40">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
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

