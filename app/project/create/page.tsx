"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Select,
  SelectItem,
} from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { title } from "@/components/primitives";
import { ChatStep } from "@/components/chat-step";
import { VideoEditorStep } from "@/components/video-editor-step";

type Step = "form" | "chat" | "video";

const steps: Step[] = ["form", "chat", "video"];

export default function CreateProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStepParam = searchParams?.get("step") as Step | null;
  const initialStep: Step =
    initialStepParam && steps.includes(initialStepParam) ? initialStepParam : "form";

  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "feature" as "feature" | "fix" | "update" | "refactor",
  });
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [videoData, setVideoData] = useState<any>(null);

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
      setCurrentStep("form");
    } else if (currentStep === "video") {
      setCurrentStep("chat");
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <h1 className={title()}>Create New Project</h1>
        <p className="text-default-500 mt-2">
          Complete all steps to create your project
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardBody className="gap-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <Chip
                  color={index <= currentStepIndex ? "primary" : "default"}
                  variant={index === currentStepIndex ? "solid" : "flat"}
                  size="sm"
                >
                  {index + 1}
                </Chip>
                <span className={`text-sm ${index === currentStepIndex ? "font-semibold" : "text-default-500"}`}>
                  {stepLabels[step]}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${index < currentStepIndex ? "bg-primary" : "bg-default-200"}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} color="primary" className="w-full" />
        </CardBody>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            Step {currentStepIndex + 1}: {stepLabels[currentStep]}
          </h2>
        </CardHeader>
        <CardBody>
          {currentStep === "form" && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <Input
                label="Title"
                placeholder="Enter project title"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("title", e.target.value)}
                isRequired
                variant="bordered"
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm text-foreground-500">Description</label>
                <textarea
                  placeholder="Enter project description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-default-200 rounded-lg text-foreground placeholder:text-default-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  rows={4}
                />
              </div>

              <Select
                label="Type"
                placeholder="Select project type"
                selectedKeys={[formData.type]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  handleChange("type", selected);
                }}
                variant="bordered"
              >
                <SelectItem key="feature">Feature</SelectItem>
                <SelectItem key="fix">Fix</SelectItem>
                <SelectItem key="update">Update</SelectItem>
                <SelectItem key="refactor">Refactor</SelectItem>
              </Select>

              <div className="flex gap-3 justify-end mt-4">
                <Button
                  variant="light"
                  onPress={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  disabled={!formData.title.trim()}
                >
                  Next: AI Chat
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
        </CardBody>
      </Card>
    </div>
  );
}
