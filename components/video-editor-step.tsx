"use client";

import type {
  ChatMessage,
  TransitionType,
  VideoSettings,
} from "@/context/project-context";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

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

type ImageItem = {
  id: string;
  previewUrl: string;
  fileName?: string;
  file?: File;
  duration: number;
};

const transitionOptions: TransitionType[] = [
  "none",
  "fade",
  "slide",
  "zoom",
  "crossfade",
  "wipe",
];
const IMAGE_DURATION = 4;
const PREVIEW_TRANSITION_DURATION_MS = 900;

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function VideoEditorStep({
  formData,
  chatHistory,
  videoData,
  onVideoUpdate,
  onComplete,
  onBack,
}: VideoEditorStepProps) {
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    duration: videoData.duration ?? 0,
    resolution: videoData.resolution ?? "1080p",
    frameRate: videoData.frameRate ?? 30,
    aspectRatio: videoData.aspectRatio ?? "16:9",
    timelineItems: videoData.timelineItems ?? [],
    libraryItems: videoData.libraryItems ?? [],
    exportedVideoUrl: videoData.exportedVideoUrl,
    exportedVideoBlob: videoData.exportedVideoBlob,
  });

  const [images, setImages] = useState<ImageItem[]>(
    () =>
      videoData.libraryItems?.map((item) => ({
        id: item.id,
        previewUrl: item.url,
        fileName: item.fileName,
        duration: item.duration ?? IMAGE_DURATION,
      })) ?? [],
  );

  const [transitionType, setTransitionType] = useState<TransitionType>(
    (videoData.timelineItems?.[0]?.transition as TransitionType) || "fade",
  );

  const [isPreviewReady, setIsPreviewReady] = useState(
    Boolean(videoData.timelineItems?.length && videoData.libraryItems?.length),
  );
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadInputId = "video-image-upload";
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewAnimationRef = useRef<number | null>(null);

  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => {
      imagesRef.current.forEach((image) => {
        if (image.file) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    },
    [],
  );

  const updateVideoState = (
    updater: (prev: VideoSettings) => VideoSettings,
  ) => {
    setVideoSettings((prev) => {
      const updated = updater(prev);

      onVideoUpdate(updated);

      return updated;
    });
  };

  const syncLibraryFromImages = (list: ImageItem[]) => {
    updateVideoState((prev) => ({
      ...prev,
      libraryItems: list.map((item) => ({
        id: item.id,
        type: "image",
        url: item.previewUrl,
        duration: item.duration,
        fileName: item.file?.name || item.fileName,
      })),
      timelineItems: [],
      duration: 0,
      exportedVideoUrl: undefined,
      exportedVideoBlob: undefined,
    }));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const freshImages: ImageItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        return;
      }
      freshImages.push({
        id: createId(),
        file,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        duration: IMAGE_DURATION,
      });
    });

    if (!freshImages.length) {
      setError("Dodaj przynajmniej jeden obraz w formacie JPG lub PNG.");

      return;
    }

    const updatedImages = [...images, ...freshImages];

    setImages(updatedImages);
    syncLibraryFromImages(updatedImages);
    setError(null);
    setIsPreviewReady(false);
  };

  const handleRemoveImage = (id: string) => {
    const updatedImages = images.filter((image) => image.id !== id);
    const removedImage = images.find((image) => image.id === id);

    if (removedImage?.file) {
      URL.revokeObjectURL(removedImage.previewUrl);
    }
    setImages(updatedImages);
    syncLibraryFromImages(updatedImages);
    setIsPreviewReady(false);
  };

  const handleTransitionSelect = (transition: TransitionType) => {
    setTransitionType(transition);
    setIsPreviewReady(false);
  };

  useEffect(() => {
    if (!isPreviewReady) {
      setActivePreviewIndex(0);
      const canvas = previewCanvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isPreviewReady]);

  const buildTimelineItems = (list: ImageItem[]) =>
    list.map((item, index) => ({
      id: `timeline-${item.id}`,
      libraryItemId: item.id,
      duration: item.duration,
      startTime: index * item.duration,
      transition: transitionType,
      transitionDuration: transitionType === "none" ? 0 : 1,
    }));

  const generatePreview = () => {
    if (!images.length) {
      setError("Dodaj obrazy, aby przygotować podgląd.");

      return;
    }

    setIsGeneratingPreview(true);
    setError(null);

    const timelineItems = buildTimelineItems(images);

    updateVideoState((prev) => ({
      ...prev,
      timelineItems,
      duration: timelineItems.reduce((total, item) => total + item.duration, 0),
      exportedVideoUrl: undefined,
      exportedVideoBlob: undefined,
    }));

    setIsPreviewReady(true);
    setIsGeneratingPreview(false);
  };

  const isGenerateDisabled = !images.length || isGeneratingPreview;
  const canComplete = isPreviewReady && images.length > 0;

  useEffect(() => {
    const canvas = previewCanvasRef.current;

    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!isPreviewReady || !images.length) {
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
      }

      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return;
    }

    let isCancelled = false;

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Image failed to load"));
        img.src = src;
      });

    const drawImageToCanvas = (img: HTMLImageElement) => {
      const { width, height } = canvas;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);
      const scale = Math.max(width / img.width, height / img.height);
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    };

    const renderTransition = (
      img1: HTMLImageElement,
      img2: HTMLImageElement,
      progress: number,
      transition: TransitionType,
    ) => {
      const { width, height } = canvas;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      const scaleImage = (img: HTMLImageElement) => {
        const scale = Math.max(width / img.width, height / img.height);

        return {
          drawWidth: img.width * scale,
          drawHeight: img.height * scale,
          x: (width - img.width * scale) / 2,
          y: (height - img.height * scale) / 2,
        };
      };

      const img1Props = scaleImage(img1);
      const img2Props = scaleImage(img2);

      switch (transition) {
        case "fade":
        case "crossfade": {
          ctx.globalAlpha = 1 - progress;
          ctx.drawImage(
            img1,
            img1Props.x,
            img1Props.y,
            img1Props.drawWidth,
            img1Props.drawHeight,
          );
          ctx.globalAlpha = progress;
          ctx.drawImage(
            img2,
            img2Props.x,
            img2Props.y,
            img2Props.drawWidth,
            img2Props.drawHeight,
          );
          ctx.globalAlpha = 1;
          break;
        }
        case "slide": {
          ctx.drawImage(
            img1,
            img1Props.x,
            img1Props.y,
            img1Props.drawWidth,
            img1Props.drawHeight,
          );
          ctx.save();
          ctx.translate(width * (1 - progress), 0);
          ctx.drawImage(
            img2,
            img2Props.x,
            img2Props.y,
            img2Props.drawWidth,
            img2Props.drawHeight,
          );
          ctx.restore();
          break;
        }
        case "zoom": {
          const zoomOut = 1 + progress * 0.3;
          const zoomIn = 0.7 + progress * 0.3;

          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(zoomOut, zoomOut);
          ctx.globalAlpha = 1 - progress;
          ctx.drawImage(
            img1,
            img1Props.x - width / 2,
            img1Props.y - height / 2,
            img1Props.drawWidth,
            img1Props.drawHeight,
          );
          ctx.restore();

          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(zoomIn, zoomIn);
          ctx.globalAlpha = progress;
          ctx.drawImage(
            img2,
            img2Props.x - width / 2,
            img2Props.y - height / 2,
            img2Props.drawWidth,
            img2Props.drawHeight,
          );
          ctx.restore();
          ctx.globalAlpha = 1;
          break;
        }
        case "wipe": {
          ctx.drawImage(
            img1,
            img1Props.x,
            img1Props.y,
            img1Props.drawWidth,
            img1Props.drawHeight,
          );
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, width * progress, height);
          ctx.clip();
          ctx.drawImage(
            img2,
            img2Props.x,
            img2Props.y,
            img2Props.drawWidth,
            img2Props.drawHeight,
          );
          ctx.restore();
          break;
        }
        default: {
          ctx.drawImage(
            img2,
            img2Props.x,
            img2Props.y,
            img2Props.drawWidth,
            img2Props.drawHeight,
          );
          break;
        }
      }
    };

    Promise.all(images.map((image) => loadImage(image.previewUrl)))
      .then((loadedImages) => {
        if (isCancelled) return;

        const clipDurationMs = IMAGE_DURATION * 1000;
        const transitionDurationMs =
          transitionType === "none" ? 0 : PREVIEW_TRANSITION_DURATION_MS;
        const segmentDuration = clipDurationMs + transitionDurationMs;
        const totalDuration = segmentDuration * loadedImages.length;

        const animate = (start: number) => {
          if (isCancelled) return;
          const loop = (timestamp: number) => {
            if (isCancelled) return;

            const elapsed = (timestamp - start) % totalDuration;
            const segmentIndex = Math.floor(elapsed / segmentDuration);
            const timeWithinSegment = elapsed % segmentDuration;

            setActivePreviewIndex(segmentIndex);

            const currentImage = loadedImages[segmentIndex];
            const nextImage =
              loadedImages[(segmentIndex + 1) % loadedImages.length];

            if (
              timeWithinSegment < clipDurationMs ||
              transitionDurationMs === 0
            ) {
              drawImageToCanvas(currentImage);
            } else {
              const progress =
                (timeWithinSegment - clipDurationMs) / transitionDurationMs;

              renderTransition(
                currentImage,
                nextImage,
                Math.min(Math.max(progress, 0), 1),
                transitionType,
              );
            }

            previewAnimationRef.current = requestAnimationFrame(loop);
          };

          previewAnimationRef.current = requestAnimationFrame(loop);
        };

        animate(performance.now());
      })
      .catch(() => {
        if (!isCancelled) {
          setError("Nie udało się załadować podglądu. Spróbuj ponownie.");
        }
      });

    return () => {
      isCancelled = true;
      if (previewAnimationRef.current) {
        cancelAnimationFrame(previewAnimationRef.current);
      }
    };
  }, [images, isPreviewReady, transitionType]);

  return (
    <div className="flex flex-col gap-6">
      <div className="neon-panel neon-panel--muted space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="neon-section-title">Materiały do wideo</p>
          <span className="text-xs text-white/60">
            {images.length
              ? `${images.length} obraz${images.length === 1 ? "" : "y"}`
              : "Brak materiałów"}
          </span>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Dodaj obrazy
            </p>
            <label
              className={clsx(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center transition hover:border-white/40",
                isDragActive && "border-white/60 bg-white/10",
              )}
              htmlFor={uploadInputId}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragActive(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragActive(false);
                handleFilesSelected(event.dataTransfer.files);
              }}
            >
              <input
                multiple
                accept="image/*"
                className="sr-only"
                id={uploadInputId}
                type="file"
                onChange={(event) => {
                  handleFilesSelected(event.target.files);
                  event.target.value = "";
                }}
              />
              <p className="text-sm font-semibold text-white">
                Przeciągnij i upuść lub kliknij, aby dodać obrazy
              </p>
              <p className="text-xs text-white/60">
                Obsługujemy JPG, PNG i WEBP. Minimum jeden plik.
              </p>
            </label>

            {!!images.length && (
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                  >
                    <img
                      alt={image.fileName ?? `Obraz ${index + 1}`}
                      className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                      src={image.previewUrl}
                    />
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">
                      #{index + 1}
                    </div>
                    <button
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white transition hover:bg-black"
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Przejścia
            </p>
            <div className="flex flex-wrap gap-2 mb-2 overflow-x-auto">
              {transitionOptions.map((transition) => (
                <button
                  key={transition}
                  className={clsx(
                    "option-pill m-1",
                    transitionType === transition && "is-active",
                  )}
                  type="button"
                  onClick={() => handleTransitionSelect(transition)}
                >
                  {transition}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/60">
              Wybrane przejście zostanie zastosowane pomiędzy wszystkimi
              slajdami.
            </p>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/55">
              Podgląd
            </p>
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="relative h-48 w-full overflow-hidden rounded-xl bg-black/30">
                {images.length ? (
                  <>
                    <canvas ref={previewCanvasRef} className="h-full w-full" />
                    {isPreviewReady && images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                        {images.map((_, index) => (
                          <span
                            key={`${images[index]?.id}-dot`}
                            className={clsx(
                              "h-1.5 w-1.5 rounded-full transition",
                              index === activePreviewIndex
                                ? "bg-white"
                                : "bg-white/30",
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/40">
                    Dodaj obrazy aby zobaczyć podgląd
                  </div>
                )}
              </div>

              <button
                className="neon-button w-full px-5 py-3 text-[11px]"
                disabled={isGenerateDisabled}
                type="button"
                onClick={generatePreview}
              >
                {isGeneratingPreview
                  ? "Przygotowujemy podgląd..."
                  : "Generuj podgląd"}
              </button>

              {error && <p className="text-xs text-rose-300">{error}</p>}
              {!error && !isPreviewReady && images.length > 0 && (
                <p className="text-xs text-white/60">
                  Dodano materiały — wygeneruj podgląd, aby przejść dalej.
                </p>
              )}
              {isPreviewReady && (
                <p className="text-xs text-emerald-300">
                  Podgląd gotowy! Możesz stworzyć projekt.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 card-content">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Tytuł
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formData.title || "Brak tytułu"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-2 card-content">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Opis
            </p>
            <p className="mt-2 text-sm text-white/70 whitespace-pre-line">
              {formData.description ||
                "Brak opisu – możesz dodać go na wcześniejszym etapie."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 card-content">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Chat
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {chatHistory.length}
            </p>
            <p className="text-xs text-white/60">wiadomości wymienione</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
        <button
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/50"
          type="button"
          onClick={onBack}
        >
          Wstecz
        </button>
        <button
          className="neon-button px-6 py-3 text-[11px]"
          disabled={!canComplete}
          type="button"
          onClick={() => {
            console.log("[GiftTune] Creating project with video settings:", {
              formData,
              chatHistory,
              videoData: { ...videoSettings },
            });
            onComplete();
          }}
        >
          Summart
        </button>
      </div>
    </div>
  );
}
