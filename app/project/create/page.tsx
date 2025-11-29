"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Select,
  SelectItem,
} from "@heroui/select";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { ChatStep } from "@/components/chat-step";
import { VideoEditorStep } from "@/components/video-editor-step";
import { useProject } from "@/context/project-context";

type Step = "form" | "chat" | "video";

const steps: Step[] = ["form", "chat", "video"];

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { data, setChatHistory, setVideoData } = useProject();

  const initialStepParam = searchParams?.get("step") as Step | null;
  const initialStep: Step =
    initialStepParam && steps.includes(initialStepParam) ? initialStepParam : "form";

  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [hasVisitedForm, setHasVisitedForm] = useState(initialStep === "form");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "feature" as "feature" | "fix" | "update" | "refactor",
  });

  // Derive chat and video from context
  const chatHistory = data.chat;
  const videoData = data.video;

  const stepLabels = {
    form: "Project Details",
    chat: "AI Chat",
    video: "Video Editor",
  };
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setHasVisitedForm(true);
    setCurrentStep("chat");
  };

  const handleChatComplete = () => {
    setCurrentStep("video");
  };

  const sendVideoMakerRequest = async (payload: {
    id: string;
    title: string;
    description: string;
    type: string;
    chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
    videoData: any;
    date: string;
  }) => {
    console.log("[VideoMakerAPI] POST /api/video-maker", payload);
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  const handleVideoComplete = async () => {
    // Create project with all data
    const newId = Date.now().toString();
    const projectData = {
      id: newId,
      ...formData,
      chatHistory,
      videoData,
      date: new Date().toISOString().split("T")[0],
    };

    // Simulate API call to our future video maker service
    await sendVideoMakerRequest(projectData);

    // Store in localStorage (in a real app, this would be saved to a database)
    if (typeof window !== "undefined") {
      const storedProjects = localStorage.getItem("projects");
      const projects = storedProjects ? JSON.parse(storedProjects) : {};
      projects[newId] = projectData;
      localStorage.setItem("projects", JSON.stringify(projects));
    }
    
    // Redirect to the new project page
    router.push(`/project/${newId}`);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    if (currentStep === "chat") {
      if (!hasVisitedForm) {
        router.push("/");
        return;
      }
      setCurrentStep("form");
    } else if (currentStep === "video") {
      setCurrentStep("chat");
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentStep]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[calc(100vh-6rem)] w-full px-4 pt-28 pb-12 md:px-8 md:pt-32 md:pb-16"
    >
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0c0022]/85 via-[#050015]/92 to-[#080024]/90 p-6 sm:p-10 shadow-[0_45px_140px_rgba(90,9,146,0.55)]">
          <div className="absolute -top-32 -left-10 h-72 w-72 blurred-spot bg-[#ff4bd8]" />
          <div className="absolute -bottom-20 -right-10 h-64 w-64 blurred-spot bg-[#5a7bff]" />

          <div className="relative z-10 flex flex-col gap-8">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/60">
                GiftTune • Kreator projektu
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white">
                Tworzymy prezent w trzech krokach
              </h1>
              <p className="text-white/70 max-w-3xl">
                Wypełnij krótki brief, porozmawiaj z naszym AI i dopracuj wideo, aby podarować bliskiej osobie personalizowany utwór.
              </p>
            </div>

            <div className="neon-panel space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-white/60">
                  <span className="rounded-full border border-white/30 px-4 py-1 text-white/80">
                    Krok {currentStepIndex + 1} z {steps.length}
                  </span>
                  <span>Postęp projektu</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {steps.map((step, index) => (
                    <div key={step} className="flex items-center gap-2">
                      <Chip
                        color={index <= currentStepIndex ? "primary" : "default"}
                        variant={index === currentStepIndex ? "solid" : "flat"}
                        size="sm"
                      >
                        {index + 1}
                      </Chip>
                      <span className={`text-sm ${index === currentStepIndex ? "text-white font-semibold" : "text-white/60"}`}>
                        {stepLabels[step]}
                      </span>
                      {index < steps.length - 1 && (
                        <div className={`w-10 h-px ${index < currentStepIndex ? "bg-gradient-to-r from-pink-500 to-indigo-500" : "bg-white/20"}`} />
                      )}
                    </div>
                  ))}
                </div>
                <Progress value={progress} className="w-full" color="primary" />
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 sm:p-8 space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/55">
                    Etap {currentStepIndex + 1}
                  </p>
                  <h2 className="text-2xl font-semibold text-white">{stepLabels[currentStep]}</h2>
                </div>

                {currentStep === "form" && (
                  <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                    <Input
                      label="Tytuł projektu"
                      placeholder="np. Urodzinowa niespodzianka dla Ani"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("title", e.target.value)}
                      isRequired
                      variant="bordered"
                      classNames={{
                        label: "text-white/70",
                        inputWrapper: "bg-white/5 border-white/20",
                        input: "text-white",
                      }}
                    />

                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-white/70">Opis projektu</label>
                      <textarea
                        placeholder="Podziel się szczegółami, które pomogą nam stworzyć wyjątkowy utwór..."
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
                        className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/80"
                        rows={4}
                      />
                    </div>

                    <Select
                      label="Rodzaj zadania"
                      placeholder="Wybierz typ projektu"
                      selectedKeys={[formData.type]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        handleChange("type", selected);
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-white/5 border-white/20 rounded-2xl text-white",
                        label: "text-white/70",
                        value: "text-white",
                        listboxWrapper: "bg-[#050017] border border-white/10 rounded-2xl",
                        popoverContent: "bg-[#050017] border border-white/10",
                      }}
                    >
                      <SelectItem key="feature">Feature</SelectItem>
                      <SelectItem key="fix">Fix</SelectItem>
                      <SelectItem key="update">Update</SelectItem>
                      <SelectItem key="refactor">Refactor</SelectItem>
                    </Select>

                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        variant="light"
                        className="rounded-full border border-white/20 text-white/80"
                        onPress={() => router.back()}
                      >
                        Anuluj
                      </Button>
                      <Button
                        className="neon-button px-6 py-3 text-[11px]"
                        type="submit"
                        disabled={!formData.title.trim()}
                      >
                        Dalej: AI Chat
                      </Button>
                    </div>
                  </form>
                )}

                {currentStep === "chat" && (
                  <ChatStep
                    formData={formData}
                    chatHistory={chatHistory}
                    onChatUpdate={setChatHistory}
                    onComplete={handleChatComplete}
                    onBack={handleBack}
                  />
                )}

                {currentStep === "video" && (
                  <VideoEditorStep
                    formData={formData}
                    chatHistory={chatHistory}
                    videoData={videoData}
                    onVideoUpdate={setVideoData}
                    onComplete={handleVideoComplete}
                    onBack={handleBack}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
