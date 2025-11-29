"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Tabs, Tab } from "@heroui/tabs";
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
      {/* Video Editor Component */}
      <VideoEditor
        onExport={handleVideoExport}
        onUpdate={handleMediaUpdate}
      />

      {/* Additional Video Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Export Settings</h3>
        </CardHeader>
        <CardBody>
          <Tabs aria-label="Video settings tabs" defaultSelectedKey="basic">
            <Tab key="basic" title="Basic">
              <div className="flex flex-col gap-4 py-4">
                <div>
                  <label className="text-sm text-foreground-500 mb-2 block">Resolution</label>
                  <div className="flex gap-2">
                    {["720p", "1080p", "1440p", "4K"].map((res) => (
                      <Button
                        key={res}
                        size="sm"
                        variant={videoSettings.resolution === res ? "solid" : "bordered"}
                        color={videoSettings.resolution === res ? "primary" : "default"}
                        onPress={() => handleSettingChange("resolution", res)}
                      >
                        {res}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-foreground-500 mb-2 block">
                    Frame Rate: {videoSettings.frameRate} fps
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={60}
                    step={6}
                    value={videoSettings.frameRate}
                    onChange={(e) => handleSettingChange("frameRate", parseInt(e.target.value))}
                    className="w-full h-2 bg-default-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-default-500 mt-1">
                    <span>24fps</span>
                    <span>60fps</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-foreground-500 mb-2 block">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {["16:9", "9:16", "1:1", "4:3"].map((ratio) => (
                      <Button
                        key={ratio}
                        size="sm"
                        variant={videoSettings.aspectRatio === ratio ? "solid" : "bordered"}
                        color={videoSettings.aspectRatio === ratio ? "primary" : "default"}
                        onPress={() => handleSettingChange("aspectRatio", ratio)}
                      >
                        {ratio}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="effects" title="Effects">
              <div className="flex flex-col gap-4 py-4">
                <Switch
                  isSelected={videoSettings.enableTransitions}
                  onValueChange={(value) => handleSettingChange("enableTransitions", value)}
                >
                  Enable Transitions
                </Switch>

                <Switch
                  isSelected={videoSettings.enableMusic}
                  onValueChange={(value) => handleSettingChange("enableMusic", value)}
                >
                  Enable Background Music
                </Switch>

                {videoSettings.enableMusic && (
                  <div>
                    <label className="text-sm text-foreground-500 mb-2 block">
                      Volume: {videoSettings.volume}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={videoSettings.volume}
                      onChange={(e) => handleSettingChange("volume", parseInt(e.target.value))}
                      className="w-full h-2 bg-default-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-default-500 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="content" title="Project Info">
              <div className="flex flex-col gap-4 py-4">
                <div>
                  <label className="text-sm text-foreground-500 mb-2 block">Project Title</label>
                  <Input
                    value={formData.title}
                    variant="bordered"
                    isReadOnly
                    description="From project details"
                  />
                </div>

                <div>
                  <label className="text-sm text-foreground-500 mb-2 block">Description</label>
                  <textarea
                    value={formData.description}
                    readOnly
                    className="w-full px-3 py-2 bg-transparent border border-default-200 rounded-lg text-foreground resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-default-500 mt-1">From project details</p>
                </div>

                <div>
                  <label className="text-sm text-foreground-500 mb-2 block">Chat Summary</label>
                  <div className="p-3 bg-default-100 dark:bg-default-200 rounded-lg max-h-32 overflow-y-auto">
                    <p className="text-sm text-default-700">
                      {chatHistory.length} messages exchanged
                    </p>
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-end pt-2 border-t border-default-200">
        <Button variant="light" onPress={onBack}>
          Back
        </Button>
        <Button color="primary" onPress={onComplete}>
          Create Project
        </Button>
      </div>
    </div>
  );
}

