"use client";

import * as React from "react";

export type MediaType = "image" | "video";
export type TransitionType =
  | "none"
  | "fade"
  | "slide"
  | "zoom"
  | "crossfade"
  | "wipe";

export interface SerializedLibraryItem {
  id: string;
  type: MediaType;
  url: string;
  duration?: number;
  fileName?: string;
}

export interface SerializedTimelineItem {
  id: string;
  libraryItemId: string;
  duration: number;
  startTime: number;
  transition?: TransitionType;
  transitionDuration?: number;
}

export interface StartData {
  occasion: string;
  occasionCustomDetail: string | null;
  relation: string;
  relationCustomDetail: string | null;
  recipientName: string;
  vibe: string;
  vibeCustomDetail: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface VideoSettings {
  duration: number;
  resolution: string;
  frameRate: number;
  aspectRatio: string;
  timelineItems: SerializedTimelineItem[];
  libraryItems: SerializedLibraryItem[];
  exportedVideoUrl?: string;
  exportedVideoBlob?: Blob;
}

export interface ProjectData {
  start: StartData;
  chat: ChatMessage[];
  video: VideoSettings;
}

const defaultStartData: StartData = {
  occasion: "birthday",
  occasionCustomDetail: null,
  relation: "partner",
  relationCustomDetail: null,
  recipientName: "",
  vibe: "pop",
  vibeCustomDetail: null,
};

const defaultVideoSettings: VideoSettings = {
  duration: 30,
  resolution: "1080p",
  frameRate: 30,
  aspectRatio: "16:9",
  timelineItems: [],
  libraryItems: [],
};

interface ProjectContextValue {
  data: ProjectData;
  setStartData: (data: Partial<StartData>) => void;
  setChatHistory: (messages: ChatMessage[]) => void;
  setVideoData: (data: Partial<VideoSettings>) => void;
  resetProject: () => void;
}

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = React.useState<ProjectData>({
    start: defaultStartData,
    chat: [],
    video: defaultVideoSettings,
  });

  const setStartData = React.useCallback((partial: Partial<StartData>) => {
    setData((prev) => ({
      ...prev,
      start: { ...prev.start, ...partial },
    }));
  }, []);

  const setChatHistory = React.useCallback((messages: ChatMessage[]) => {
    setData((prev) => ({
      ...prev,
      chat: messages,
    }));
  }, []);

  const setVideoData = React.useCallback((partial: Partial<VideoSettings>) => {
    setData((prev) => ({
      ...prev,
      video: { ...prev.video, ...partial },
    }));
  }, []);

  const resetProject = React.useCallback(() => {
    setData({
      start: defaultStartData,
      chat: [],
      video: defaultVideoSettings,
    });
  }, []);

  const value = React.useMemo(
    () => ({ data, setStartData, setChatHistory, setVideoData, resetProject }),
    [data, setStartData, setChatHistory, setVideoData, resetProject]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return ctx;
}

