"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";
import type {
  SerializedLibraryItem,
  SerializedTimelineItem,
  TransitionType,
} from "@/context/project-context";

interface LibraryItem extends SerializedLibraryItem {
  file?: File;
}

type TimelineItem = SerializedTimelineItem;

interface VideoEditorProps {
  onExport?: (videoBlob: Blob) => void;
  onUpdate?: (timelineItems: TimelineItem[], libraryItems: LibraryItem[]) => void;
  initialLibraryItems?: SerializedLibraryItem[];
  initialTimelineItems?: SerializedTimelineItem[];
}

export function VideoEditor({
  onExport,
  onUpdate,
  initialLibraryItems,
  initialTimelineItems,
}: VideoEditorProps) {
  const [mediaLibrary, setMediaLibrary] = useState<LibraryItem[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [, setIsExporting] = useState(false);
  const [, setExportProgress] = useState(0);
  const [defaultTransition, setDefaultTransition] = useState<TransitionType>("fade");
  const [defaultTransitionDuration, setDefaultTransitionDuration] = useState(0.5);
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryScrollRef = useRef<HTMLDivElement | null>(null);
  const isPlayingRef = useRef(false);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const onUpdateRef = useRef<VideoEditorProps["onUpdate"]>();
  const mediaLibraryRef = useRef<LibraryItem[]>([]);
  const hasHydratedRef = useRef(false);

  // Calculate total duration
  const totalDuration = timelineItems.reduce((acc, item) => {
    const endTime = item.startTime + item.duration;
    return Math.max(acc, endTime);
  }, 0);

  // Get library item by ID
  const getLibraryItem = (id: string) => {
    return mediaLibrary.find((item) => item.id === id);
  };

  const activeTimelineItem = selectedTimelineItem
    ? timelineItems.find((item) => item.id === selectedTimelineItem)
    : null;
  const activeLibraryItem = activeTimelineItem ? getLibraryItem(activeTimelineItem.libraryItemId) : null;
  const isDetailsDisabled = !activeTimelineItem || !activeLibraryItem;
  const isImageClip = activeLibraryItem?.type === "image";

  // Hydrate from initial data
  useEffect(() => {
    if (hasHydratedRef.current) return;

    let didHydrate = false;

    if (initialLibraryItems && initialLibraryItems.length > 0) {
      setMediaLibrary(initialLibraryItems.map((item) => ({ ...item } as LibraryItem)));
      didHydrate = true;
    }

    if (initialTimelineItems && initialTimelineItems.length > 0) {
      setTimelineItems(initialTimelineItems);
      didHydrate = true;
    }

    if (didHydrate) {
      hasHydratedRef.current = true;
    }
  }, [initialLibraryItems, initialTimelineItems]);

  // Handle file upload to library
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      
      if (isVideo) {
        alert("Dodawanie klipów wideo jest chwilowo wyłączone. Wgraj proszę zdjęcia.");
        return;
      }

      if (!isImage) {
        alert(`${file.name} nie jest obsługiwanym plikiem graficznym`);
        return;
      }

      const url = URL.createObjectURL(file);
      const id = `${Date.now()}-${Math.random()}`;
      
      const newItem: LibraryItem = {
        id,
        type: isVideo ? "video" : "image",
        file,
        fileName: file.name,
        url,
      };

      // If it's a video, get its duration
      if (isVideo) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          setMediaLibrary((prev) => {
            const updated = prev.map((item) =>
              item.id === id ? { ...item, duration: video.duration } : item
            );
            return updated;
          });
        };
        video.src = url;
      }

      setMediaLibrary((prev) => {
        const updated = [...prev, newItem];
        return updated;
      });
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove item from library
  const handleRemoveFromLibrary = (id: string) => {
      setMediaLibrary((prev) => {
      const updated = prev.filter((item) => {
        if (item.id === id) {
          URL.revokeObjectURL(item.url);
          return false;
        }
        return true;
      });
      // Also remove from timeline if it exists there
      setTimelineItems((prev) => {
        const filtered = prev.filter((item) => item.libraryItemId !== id);
        // Recalculate start times
        let currentTime = 0;
        const reordered = filtered.map((item) => {
          const newItem = { ...item, startTime: currentTime };
          currentTime += item.duration;
          return newItem;
        });
        return reordered;
      });
      return updated;
    });
  };

  // Add item from library to timeline
  const handleAddToTimeline = (libraryItemId: string) => {
    const libraryItem = getLibraryItem(libraryItemId);
    if (!libraryItem) return;

    const defaultDuration = libraryItem.type === "image" ? 3 : (libraryItem.duration || 3);
    
    const newTimelineItem: TimelineItem = {
      id: `${Date.now()}-${Math.random()}`,
      libraryItemId: libraryItemId,
      duration: defaultDuration,
      startTime: totalDuration, // Add at the end
      transition: defaultTransition,
      transitionDuration: defaultTransitionDuration,
    };

    setTimelineItems((prev) => {
      const updated = [...prev, newTimelineItem];
      return updated;
    });
  };

  // Remove item from timeline
  const handleRemoveFromTimeline = (id: string) => {
    setTimelineItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      // Recalculate start times
      let currentTime = 0;
      const reordered = filtered.map((item) => {
        const newItem = { ...item, startTime: currentTime };
        currentTime += item.duration;
        return newItem;
      });
      return reordered;
    });
    if (selectedTimelineItem === id) {
      setSelectedTimelineItem(null);
    }
  };

  // Update timeline item duration
  const handleDurationChange = (id: string, duration: number) => {
    setTimelineItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, duration: Math.max(0.5, duration) } : item
      );
      // Recalculate start times
      let currentTime = 0;
      const reordered = updated.map((item) => {
        const newItem = { ...item, startTime: currentTime };
        currentTime += item.duration;
        return newItem;
      });
      return reordered;
    });
  };

  // Update timeline item transition
  const handleTransitionChange = (id: string, transition: TransitionType, transitionDuration?: number) => {
    setTimelineItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id 
          ? { ...item, transition, transitionDuration: transitionDuration ?? item.transitionDuration ?? 0.5 }
          : item
      );
      return updated;
    });
  };

  // Render transition between two images
  const renderTransition = (
    ctx: CanvasRenderingContext2D,
    img1: HTMLImageElement,
    img2: HTMLImageElement,
    progress: number, // 0 to 1
    transitionType: TransitionType,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const scale1 = Math.min(canvasWidth / img1.width, canvasHeight / img1.height);
    const x1 = (canvasWidth - img1.width * scale1) / 2;
    const y1 = (canvasHeight - img1.height * scale1) / 2;

    const scale2 = Math.min(canvasWidth / img2.width, canvasHeight / img2.height);
    const x2 = (canvasWidth - img2.width * scale2) / 2;
    const y2 = (canvasHeight - img2.height * scale2) / 2;

    switch (transitionType) {
      case "fade":
        // Fade out first, fade in second
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(img1, x1, y1, img1.width * scale1, img1.height * scale1);
        ctx.globalAlpha = progress;
        ctx.drawImage(img2, x2, y2, img2.width * scale2, img2.height * scale2);
        ctx.globalAlpha = 1;
        break;

      case "crossfade":
        // Both visible, crossfade
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(img1, x1, y1, img1.width * scale1, img1.height * scale1);
        ctx.globalAlpha = progress;
        ctx.drawImage(img2, x2, y2, img2.width * scale2, img2.height * scale2);
        ctx.globalAlpha = 1;
        break;

      case "slide":
        // Slide second image from right
        ctx.drawImage(img1, x1, y1, img1.width * scale1, img1.height * scale1);
        ctx.save();
        ctx.translate(canvasWidth * (1 - progress), 0);
        ctx.drawImage(img2, x2, y2, img2.width * scale2, img2.height * scale2);
        ctx.restore();
        break;

      case "zoom":
        // Zoom out first, zoom in second
        const zoom1 = 1 + progress * 0.3;
        const zoom2 = 0.7 + progress * 0.3;
        
        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.scale(zoom1, zoom1);
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(img1, x1 - canvasWidth / 2, y1 - canvasHeight / 2, img1.width * scale1, img1.height * scale1);
        ctx.restore();

        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.scale(zoom2, zoom2);
        ctx.globalAlpha = progress;
        ctx.drawImage(img2, x2 - canvasWidth / 2, y2 - canvasHeight / 2, img2.width * scale2, img2.height * scale2);
        ctx.restore();
        ctx.globalAlpha = 1;
        break;

      case "wipe":
        // Wipe from left to right
        ctx.drawImage(img1, x1, y1, img1.width * scale1, img1.height * scale1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth * progress, canvasHeight);
        ctx.clip();
        ctx.drawImage(img2, x2, y2, img2.width * scale2, img2.height * scale2);
        ctx.restore();
        break;

      default:
        // No transition, just show second image
        ctx.drawImage(img2, x2, y2, img2.width * scale2, img2.height * scale2);
    }
  };

  // Move item up/down in timeline
  const handleMoveItem = (id: string, direction: "up" | "down") => {
    setTimelineItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      
      // Recalculate start times
      let currentTime = 0;
      const reordered = updated.map((item) => {
        const newItem = { ...item, startTime: currentTime };
        currentTime += item.duration;
        return newItem;
      });
      return reordered;
    });
  };

  // Playback controls
  const handlePlay = () => {
    if (!previewCanvasRef.current || timelineItems.length === 0) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const startTime = Date.now() - currentTime * 1000;
    const videoElements = new Map<string, HTMLVideoElement>();

    // Preload all images
    const imagePromises: Promise<void>[] = [];
    timelineItems.forEach((item) => {
      const libraryItem = getLibraryItem(item.libraryItemId);
      if (libraryItem && libraryItem.type === "image") {
        const cacheKey = libraryItem.url;
        if (!imageCacheRef.current.has(cacheKey)) {
          const img = new Image();
          const promise = new Promise<void>((resolve) => {
            img.onload = () => {
              imageCacheRef.current.set(cacheKey, img);
              resolve();
            };
            img.onerror = () => resolve(); // Continue even if image fails
            img.src = libraryItem.url;
          });
          imagePromises.push(promise);
        }
      }
    });

    // Preload video elements
    timelineItems.forEach((item) => {
      const libraryItem = getLibraryItem(item.libraryItemId);
      if (libraryItem && libraryItem.type === "video") {
        const video = document.createElement("video");
        video.src = libraryItem.url;
        video.preload = "auto";
        video.muted = true;
        videoElements.set(item.id, video);
      }
    });

    // Wait for images to load, then start rendering
    Promise.all(imagePromises).then(() => {
      if (!isPlayingRef.current) return; // Check if still playing after images load

    const renderFrame = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentTime(0);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        videoElements.forEach((video) => {
          video.pause();
          video.currentTime = 0;
        });
        return;
      }

      setCurrentTime(elapsed);

      // Find current item and check for transition
      const currentItem = timelineItems.find(
        (item) => elapsed >= item.startTime && elapsed < item.startTime + item.duration
      );

      // Check if we're in a transition period
      const currentIndex = currentItem ? timelineItems.findIndex((item) => item.id === currentItem.id) : -1;
      const nextItem = currentIndex >= 0 && currentIndex < timelineItems.length - 1 
        ? timelineItems[currentIndex + 1] 
        : null;
      
      const transitionDuration = currentItem?.transitionDuration || 0.5;
      const isInTransition = currentItem && nextItem && 
        elapsed >= currentItem.startTime + currentItem.duration - transitionDuration &&
        elapsed < currentItem.startTime + currentItem.duration &&
        currentItem.transition && currentItem.transition !== "none";

      if (isInTransition && currentItem && nextItem) {
        const libraryItem1 = getLibraryItem(currentItem.libraryItemId);
        const libraryItem2 = getLibraryItem(nextItem.libraryItemId);
        
        if (libraryItem1 && libraryItem2 && 
            libraryItem1.type === "image" && libraryItem2.type === "image") {
          const transitionProgress = Math.max(0, Math.min(1, 
            (elapsed - (currentItem.startTime + currentItem.duration - transitionDuration)) / transitionDuration
          ));
          
          const img1 = imageCacheRef.current.get(libraryItem1.url);
          const img2 = imageCacheRef.current.get(libraryItem2.url);
          
          if (img1 && img2) {
            renderTransition(
              ctx,
              img1,
              img2,
              transitionProgress,
              currentItem.transition || "fade",
              canvas.width,
              canvas.height
            );
          }
        } else {
          // Fallback to normal rendering
          if (currentItem) {
            const libraryItem = getLibraryItem(currentItem.libraryItemId);
            if (!libraryItem) return;

            if (libraryItem.type === "image") {
              const img = imageCacheRef.current.get(libraryItem.url);
              if (img) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const scale = Math.min(
                  canvas.width / img.width,
                  canvas.height / img.height
                );
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
              }
            }
          }
        }
      } else if (currentItem) {
        const libraryItem = getLibraryItem(currentItem.libraryItemId);
        if (!libraryItem) return;

        if (libraryItem.type === "image") {
          const img = imageCacheRef.current.get(libraryItem.url);
          if (img) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Center and scale image
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            );
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          }
        } else {
          // For video
          const video = videoElements.get(currentItem.id);
          if (video) {
            const videoTime = elapsed - currentItem.startTime;
            if (Math.abs(video.currentTime - videoTime) > 0.1) {
              video.currentTime = videoTime;
            }
            if (video.readyState >= 2) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = "#000";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              const scale = Math.min(
                canvas.width / video.videoWidth,
                canvas.height / video.videoHeight
              );
              const x = (canvas.width - video.videoWidth * scale) / 2;
              const y = (canvas.height - video.videoHeight * scale) / 2;
              
              ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
            }
          }
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (isPlayingRef.current) {
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();
    });
  };

  const handlePause = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Update canvas with current frame when paused
    if (previewCanvasRef.current && timelineItems.length > 0) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentItem = timelineItems.find(
        (item) => currentTime >= item.startTime && currentTime < item.startTime + item.duration
      );

      if (currentItem) {
        const libraryItem = getLibraryItem(currentItem.libraryItemId);
        if (libraryItem && libraryItem.type === "image") {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            );
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          };
          img.src = libraryItem.url;
        }
      }
    }
  };

  const handleSeek = (time: number) => {
    const newTime = Math.max(0, Math.min(time, totalDuration));
    setCurrentTime(newTime);
    
    // Update preview immediately
    if (previewCanvasRef.current && timelineItems.length > 0) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentItem = timelineItems.find(
        (item) => newTime >= item.startTime && newTime < item.startTime + item.duration
      );

      if (currentItem) {
        const libraryItem = getLibraryItem(currentItem.libraryItemId);
        if (!libraryItem) return;

        if (libraryItem.type === "image") {
          const drawImage = (img: HTMLImageElement) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            );
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          };

          const cachedImg = imageCacheRef.current.get(libraryItem.url);
          if (cachedImg) {
            drawImage(cachedImg);
          } else {
            // If not cached, load it
            const newImg = new Image();
            newImg.onload = () => {
              imageCacheRef.current.set(libraryItem.url, newImg);
              drawImage(newImg);
            };
            newImg.src = libraryItem.url;
          }
        } else {
          // For video, seek to the correct time
          const video = document.createElement("video");
          video.src = libraryItem.url;
          video.currentTime = newTime - currentItem.startTime;
          video.onloadeddata = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const scale = Math.min(
              canvas.width / video.videoWidth,
              canvas.height / video.videoHeight
            );
            const x = (canvas.width - video.videoWidth * scale) / 2;
            const y = (canvas.height - video.videoHeight * scale) / 2;
            
            ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
          };
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    if (isPlayingRef.current) {
      handlePause();
      handlePlay();
    }
  };

  // Export video using Canvas and MediaRecorder
  const handleExport = async () => {
    if (timelineItems.length === 0) {
      alert("Please add at least one item to the timeline to export");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const stream = canvas.captureStream(30); // 30 fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        if (onExport) onExport(blob);
        setIsExporting(false);
        setExportProgress(100);
      };

      mediaRecorder.start();

      // Render each frame
      for (let time = 0; time < totalDuration; time += 1 / 30) {
        const currentItem = timelineItems.find(
          (item) => time >= item.startTime && time < item.startTime + item.duration
        );

        // Check for transition
        const currentIndex = currentItem ? timelineItems.findIndex((item) => item.id === currentItem.id) : -1;
        const nextItem = currentIndex >= 0 && currentIndex < timelineItems.length - 1 
          ? timelineItems[currentIndex + 1] 
          : null;
        
        const transitionDuration = currentItem?.transitionDuration || 0.5;
        const isInTransition = currentItem && nextItem && 
          time >= currentItem.startTime + currentItem.duration - transitionDuration &&
          time < currentItem.startTime + currentItem.duration &&
          currentItem.transition && currentItem.transition !== "none";

        if (isInTransition && currentItem && nextItem) {
          const libraryItem1 = getLibraryItem(currentItem.libraryItemId);
          const libraryItem2 = getLibraryItem(nextItem.libraryItemId);
          
          if (libraryItem1 && libraryItem2 && 
              libraryItem1.type === "image" && libraryItem2.type === "image") {
            const transitionProgress = Math.max(0, Math.min(1,
              (time - (currentItem.startTime + currentItem.duration - transitionDuration)) / transitionDuration
            ));
            
            await new Promise<void>((resolve) => {
              const img1 = new Image();
              const img2 = new Image();
              let loaded1 = false;
              let loaded2 = false;
              
              const render = () => {
                if (loaded1 && loaded2) {
                  renderTransition(
                    ctx,
                    img1,
                    img2,
                    transitionProgress,
                    currentItem.transition || "fade",
                    canvas.width,
                    canvas.height
                  );
                  resolve();
                }
              };
              
              img1.onload = () => {
                loaded1 = true;
                render();
              };
              img2.onload = () => {
                loaded2 = true;
                render();
              };
              
              img1.src = libraryItem1.url;
              img2.src = libraryItem2.url;
              
              if (img1.complete) {
                loaded1 = true;
                render();
              }
              if (img2.complete) {
                loaded2 = true;
                render();
              }
            });
          } else {
            // Fallback
            if (currentItem) {
              const libraryItem = getLibraryItem(currentItem.libraryItemId);
              if (!libraryItem) continue;

              if (libraryItem.type === "image") {
                await new Promise<void>((resolve) => {
                  const img = new Image();
                  img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#000";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    const scale = Math.min(
                      canvas.width / img.width,
                      canvas.height / img.height
                    );
                    const x = (canvas.width - img.width * scale) / 2;
                    const y = (canvas.height - img.height * scale) / 2;
                    
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    resolve();
                  };
                  img.src = libraryItem.url;
                });
              }
            }
          }
        } else if (currentItem) {
          const libraryItem = getLibraryItem(currentItem.libraryItemId);
          if (!libraryItem) continue;

          if (libraryItem.type === "image") {
            await new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Center and scale image
                const scale = Math.min(
                  canvas.width / img.width,
                  canvas.height / img.height
                );
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                resolve();
              };
              img.src = libraryItem.url;
            });
          } else {
            // For video clips
            await new Promise<void>((resolve) => {
              const video = document.createElement("video");
              video.src = libraryItem.url;
              video.currentTime = time - currentItem.startTime;
              video.onloadeddata = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const scale = Math.min(
                  canvas.width / video.videoWidth,
                  canvas.height / video.videoHeight
                );
                const x = (canvas.width - video.videoWidth * scale) / 2;
                const y = (canvas.height - video.videoHeight * scale) / 2;
                
                ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
                resolve();
              };
            });
          }
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Wait for next frame
        await new Promise((resolve) => setTimeout(resolve, 1000 / 30));
        setExportProgress((time / totalDuration) * 100);
      }

      mediaRecorder.stop();
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export video. Please try again.");
      setIsExporting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keep refs in sync with latest callbacks/data
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    mediaLibraryRef.current = mediaLibrary;
  }, [mediaLibrary]);

  // Improve horizontal scrolling experience in media library
  useEffect(() => {
    const container = libraryScrollRef.current;
    if (!container) return;

    let isPointerDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, input, textarea, a")) {
        return;
      }

      isPointerDown = true;
      startX = event.clientX;
      scrollLeft = container.scrollLeft;
      container.setPointerCapture?.(event.pointerId);
      container.classList.add("cursor-grabbing");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPointerDown) return;
      const deltaX = event.clientX - startX;
      container.scrollLeft = scrollLeft - deltaX;
    };

    const endPointerDrag = (event: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      container.releasePointerCapture?.(event.pointerId);
      container.classList.remove("cursor-grabbing");
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        container.scrollLeft += event.deltaY;
        event.preventDefault();
      }
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", endPointerDrag);
    container.addEventListener("pointerleave", endPointerDrag);
    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", endPointerDrag);
      container.removeEventListener("pointerleave", endPointerDrag);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [mediaLibrary.length]);

  // Set canvas size and render initial frame
  useEffect(() => {
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = 1920;
      previewCanvasRef.current.height = 1080;
    }
  }, []);

  // Notify parent component when media or timeline data changes
  useEffect(() => {
    if (!onUpdateRef.current) return;
    onUpdateRef.current(timelineItems, mediaLibrary);
  }, [timelineItems, mediaLibrary]);

  // Render current frame when timeline items or current time changes (when not playing)
  useEffect(() => {
    if (!isPlaying && previewCanvasRef.current && timelineItems.length > 0) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentItem = timelineItems.find(
        (item) => currentTime >= item.startTime && currentTime < item.startTime + item.duration
      );

      if (currentItem) {
        const libraryItem = getLibraryItem(currentItem.libraryItemId);
        if (!libraryItem) return;

        if (libraryItem.type === "image") {
          const drawImage = (img: HTMLImageElement) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const scale = Math.min(
              canvas.width / img.width,
              canvas.height / img.height
            );
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          };

          const cachedImg = imageCacheRef.current.get(libraryItem.url);
          if (cachedImg) {
            drawImage(cachedImg);
          } else {
            const newImg = new Image();
            newImg.onload = () => {
              imageCacheRef.current.set(libraryItem.url, newImg);
              drawImage(newImg);
            };
            newImg.src = libraryItem.url;
          }
        } else {
          const video = document.createElement("video");
          video.src = libraryItem.url;
          video.preload = "auto";
          video.currentTime = currentTime - currentItem.startTime;
          video.onloadeddata = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const scale = Math.min(
              canvas.width / video.videoWidth,
              canvas.height / video.videoHeight
            );
            const x = (canvas.width - video.videoWidth * scale) / 2;
            const y = (canvas.height - video.videoHeight * scale) / 2;
            
            ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
          };
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [timelineItems, currentTime, isPlaying, mediaLibrary]);

  return (
    <div className="flex flex-col gap-8">
      {/* Media Library Section */}
      <div className="neon-panel neon-panel--muted space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          id="media-upload"
        />
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <p className="neon-section-title">1. Biblioteka mediów</p>
            <p className="text-sm text-white/70">
              Wgraj zdjęcia, które staną się częścią Twojego hitu.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto">
            <Button
              color="primary"
              onPress={() => fileInputRef.current?.click()}
              className="neon-button w-full justify-center text-xs tracking-[0.25em]"
            >
              Wgraj media
            </Button>
          </div>
        </div>

        {mediaLibrary.length > 0 ? (
          <ScrollShadow
            orientation="horizontal"
            className="overflow-x-auto scroll-smooth cursor-grab"
            ref={libraryScrollRef}
          >
            <div className="flex gap-4 pb-1">
              {mediaLibrary.map((item) => {
                const isInTimeline = timelineItems.some((ti) => ti.libraryItemId === item.id);
                return (
                  <div
                    key={item.id}
                    className="relative min-w-[220px] max-w-[220px] rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_25px_60px_rgba(3,0,20,0.45)]"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt="Media"
                        className="h-28 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="h-28 w-full rounded-xl object-cover"
                        muted
                        playsInline
                        loop
                        autoPlay
                        preload="metadata"
                      />
                    )}
                    <span className="absolute right-3 top-3 rounded-full border border-white/30 bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.35em] text-white/80">
                      {item.type}
                    </span>
                    {item.type === "video" && item.duration && (
                      <p className="mt-2 text-xs text-white/60">{item.duration.toFixed(1)}s</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {item.type === "image" && !isInTimeline && (
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => handleAddToTimeline(item.id)}
                          className="flex-1 rounded-full bg-white/10 text-white"
                        >
                          Dodaj
                        </Button>
                      )}
                      {item.type === "video" && !isInTimeline && (
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          onPress={() => handleAddToTimeline(item.id)}
                          className="flex-1 rounded-full bg-white/10 text-white"
                        >
                          Dodaj
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleRemoveFromLibrary(item.id)}
                        className="rounded-full border border-white/20 text-white/80"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollShadow>
        ) : (
          <p className="text-center text-sm text-white/60">
            Nie dodano jeszcze żadnych mediów. Wgraj pliki, aby rozpocząć.
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="neon-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="neon-section-title">2. Linia czasu</p>
          <span className="text-xs text-white/60">
            Całkowity czas: {totalDuration.toFixed(1)}s
          </span>
        </div>
        {timelineItems.length > 0 ? (
          <>
            <ScrollShadow className="max-h-56 overflow-x-auto">
              <div className="flex min-w-full gap-3">
                {timelineItems.map((item, index) => {
                  const libraryItem = getLibraryItem(item.libraryItemId);
                  if (!libraryItem) return null;

                  const isActive = selectedTimelineItem === item.id;

                  return (
                    <div
                      key={item.id}
                      className={clsx(
                        "flex-shrink-0 rounded-2xl border-2 p-2 transition-all",
                        isActive
                          ? "border-pink-400 bg-white/10 shadow-[0_20px_40px_rgba(255,75,216,0.25)]"
                          : "border-white/10 bg-white/5 hover:border-white/30"
                      )}
                      style={{ width: "220px" }}
                      onClick={() => setSelectedTimelineItem(item.id)}
                    >
                      <div className="relative rounded-xl bg-black" style={{ height: "110px" }}>
                        {libraryItem.type === "image" ? (
                          <img
                            src={libraryItem.url}
                            alt="Preview"
                            className="h-full w-full rounded-xl object-contain"
                          />
                        ) : (
                          <video
                            src={libraryItem.url}
                            className="h-full w-full rounded-xl object-contain"
                            muted
                            playsInline
                            loop
                            autoPlay
                            preload="metadata"
                          />
                        )}
                        <span className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.35em] text-white">
                          {item.duration.toFixed(1)}s
                        </span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          isDisabled={index === 0}
                          onPress={() => handleMoveItem(item.id, "up")}
                          className="flex-1 rounded-full border border-white/20 text-white/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          isDisabled={index === timelineItems.length - 1}
                          onPress={() => handleMoveItem(item.id, "down")}
                          className="flex-1 rounded-full border border-white/20 text-white/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleRemoveFromTimeline(item.id)}
                          className="flex-1 rounded-full border border-white/20 text-white/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollShadow>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-white/60">
            Linia czasu jest pusta. Dodaj media z sekcji powyżej.
          </p>
        )}
      </div>

      {/* Item Settings */}
      <div className="neon-panel neon-panel--muted space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="neon-section-title">3. Szczegóły klipu</p>
          <span className="text-xs text-white/60">
            {activeLibraryItem
              ? `${activeLibraryItem.type === "image" ? "Zdjęcie" : "Wideo"} • ${activeTimelineItem?.duration.toFixed(1)}s`
              : "Brak wybranego klipu"}
          </span>
        </div>

        <div className={clsx("space-y-4", isDetailsDisabled && "opacity-40")}>
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-white/60">Czas trwania</label>
            <div className="mt-2 flex items-center gap-3">
              <Button
                size="sm"
                variant="flat"
                isDisabled={
                  isDetailsDisabled ||
                  activeLibraryItem?.type === "video" ||
                  (activeTimelineItem ? activeTimelineItem.duration <= 0.5 : true)
                }
                onPress={() =>
                  activeTimelineItem &&
                  handleDurationChange(activeTimelineItem.id, Math.max(0.5, activeTimelineItem.duration - 0.1))
                }
                className="rounded-full border border-white/20 text-white"
              >
                −
              </Button>
              <Input
                type="number"
                value={activeTimelineItem ? activeTimelineItem.duration.toFixed(1) : "0.0"}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!activeTimelineItem || isNaN(value) || value < 0.5 || value > 10) return;
                  handleDurationChange(activeTimelineItem.id, value);
                }}
                min={0.5}
                max={10}
                step={0.1}
                className="w-24 text-center"
                variant="bordered"
                size="sm"
                isDisabled={isDetailsDisabled || activeLibraryItem?.type === "video"}
                classNames={{
                  inputWrapper: "bg-white/5 border-white/20 rounded-2xl",
                  input: "text-center text-white",
                }}
              />
              <Button
                size="sm"
                variant="flat"
                isDisabled={
                  isDetailsDisabled ||
                  activeLibraryItem?.type === "video" ||
                  (activeTimelineItem ? activeTimelineItem.duration >= 10 : true)
                }
                onPress={() =>
                  activeTimelineItem &&
                  handleDurationChange(activeTimelineItem.id, Math.min(10, activeTimelineItem.duration + 0.1))
                }
                className="rounded-full border border-white/20 text-white"
              >
                +
              </Button>
              <span className="text-sm text-white/60">sekundy</span>
            </div>
            {activeLibraryItem?.type === "video" && (
              <p className="mt-1 text-xs text-white/50">Czas trwania wideo jest stały.</p>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-white/60">
              Przejście do kolejnego ujęcia
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["none", "fade", "crossfade", "slide", "zoom", "wipe"] as TransitionType[]).map((transition) => {
                const isSelected = activeTimelineItem?.transition === transition;
                return (
                  <Chip
                    key={transition}
                    variant={isSelected ? "solid" : "flat"}
                    color={isSelected ? "primary" : "default"}
                    className={clsx(
                      "border border-white/20 bg-white/10 text-white/80",
                      isSelected && "bg-gradient-to-r from-pink-500 to-indigo-500 text-white",
                      (!isImageClip || isDetailsDisabled) && "opacity-40 pointer-events-none"
                    )}
                    onClick={() => {
                      if (!activeTimelineItem || !isImageClip || isDetailsDisabled) return;
                      handleTransitionChange(activeTimelineItem.id, transition);
                    }}
                  >
                    {transition.charAt(0).toUpperCase() + transition.slice(1)}
                  </Chip>
                );
              })}
            </div>
          </div>

          {isImageClip && (activeTimelineItem?.transition ?? "none") !== "none" && (
            <div>
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">
                Czas trwania przejścia
              </label>
              <div className="mt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={isDetailsDisabled || (activeTimelineItem?.transitionDuration || 0.5) <= 0.2}
                  onPress={() =>
                    activeTimelineItem &&
                    handleTransitionChange(
                      activeTimelineItem.id,
                      activeTimelineItem.transition || "fade",
                      Math.max(0.2, (activeTimelineItem.transitionDuration || 0.5) - 0.1)
                    )
                  }
                  className="rounded-full border border-white/20 text-white"
                >
                  −
                </Button>
                <Input
                  type="number"
                  value={(activeTimelineItem?.transitionDuration || 0.5).toFixed(1)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!activeTimelineItem || isNaN(value) || value < 0.2 || value > 2) return;
                    handleTransitionChange(activeTimelineItem.id, activeTimelineItem.transition || "fade", value);
                  }}
                  min={0.2}
                  max={2}
                  step={0.1}
                  className="w-24 text-center"
                  variant="bordered"
                  size="sm"
                  isDisabled={isDetailsDisabled}
                  classNames={{
                    inputWrapper: "bg-white/5 border-white/20 rounded-2xl",
                    input: "text-center text-white",
                  }}
                />
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={isDetailsDisabled || (activeTimelineItem?.transitionDuration || 0.5) >= 2}
                  onPress={() =>
                    activeTimelineItem &&
                    handleTransitionChange(
                      activeTimelineItem.id,
                      activeTimelineItem.transition || "fade",
                      Math.min(2, (activeTimelineItem.transitionDuration || 0.5) + 0.1)
                    )
                  }
                  className="rounded-full border border-white/20 text-white"
                >
                  +
                </Button>
                <span className="text-sm text-white/60">sekundy</span>
              </div>
            </div>
          )}
        </div>

        {isDetailsDisabled && (
          <p className="text-sm text-white/70">Wybierz element z linii czasu, aby odblokować ustawienia.</p>
        )}
      </div>

      <div className="neon-panel space-y-4">
        <div className="flex items-center justify-between">
          <p className="neon-section-title">4. Podgląd</p>
          {timelineItems.length > 0 && (
            <span className="text-xs text-white/60">
              {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            </span>
          )}
        </div>
        <div className="relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-black/60">
          <canvas
            ref={previewCanvasRef}
            className="h-full w-full object-contain"
            style={{ maxHeight: "400px" }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-[30px] border border-white/5" />
        </div>

        {timelineItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              color="primary"
              onPress={isPlaying ? handlePause : handlePlay}
              className="neon-button px-6 py-3 text-[11px]"
            >
              {isPlaying ? "⏸ Pauza" : "▶ Odtwórz"}
            </Button>
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 accent-pink-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
