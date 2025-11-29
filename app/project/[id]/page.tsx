"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { title, subtitle } from "@/components/primitives";
import { Link } from "@heroui/link";
import NextLink from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface Project {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "feature" | "fix" | "update" | "refactor";
  chatHistory?: ChatMessage[];
  videoData?: any;
}

// Mock data - in a real app, this would come from an API or database
const mockProjects: Record<string, Project> = {
  "1": {
    id: "1",
    date: "2024-01-15",
    title: "Initial Project Setup",
    description: "Created Next.js project with HeroUI integration",
    type: "feature",
  },
  "2": {
    id: "2",
    date: "2024-01-16",
    title: "Added Navigation Bar",
    description: "Implemented responsive navbar with theme switching",
    type: "feature",
  },
  "3": {
    id: "3",
    date: "2024-01-17",
    title: "Fixed Layout Issues",
    description: "Resolved mobile responsiveness problems",
    type: "fix",
  },
  "4": {
    id: "4",
    date: "2024-01-18",
    title: "Simplified Navbar",
    description: "Removed complex features, kept essential navigation",
    type: "refactor",
  },
  "5": {
    id: "5",
    date: "2024-01-19",
    title: "Added Project History Sidebar",
    description: "Created sidebar component to track project milestones",
    type: "feature",
  },
};

function getTypeColor(type: Project["type"]) {
  switch (type) {
    case "feature":
      return "success";
    case "fix":
      return "danger";
    case "update":
      return "primary";
    case "refactor":
      return "warning";
    default:
      return "default";
  }
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  
  // Try to get project from localStorage first, then fall back to mock data
  let project: Project | undefined;
  if (typeof window !== "undefined") {
    const storedProjects = localStorage.getItem("projects");
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      project = projects[id];
    }
  }
  
  // Fall back to mock data if not found in localStorage
  if (!project) {
    project = mockProjects[id];
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <h1 className={title()}>Project Not Found</h1>
        <p className={subtitle()}>
          The project you're looking for doesn't exist.
        </p>
        <Button as={NextLink} href="/" color="primary">
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className={title()}>{project.title}</h1>
            <Chip color={getTypeColor(project.type)} variant="flat" size="sm">
              {project.type}
            </Chip>
          </div>
          <p className="text-default-500 text-sm">
            Created on {new Date(project.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button
          as={NextLink}
          href="/project/create"
          color="primary"
          variant="flat"
        >
          Create New Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Description</h2>
        </CardHeader>
        <CardBody className="card-content">
          <p className="text-default-700 whitespace-pre-wrap">
            {project.description || "No description provided."}
          </p>
        </CardBody>
      </Card>

      {(project.chatHistory || project.videoData) && (
        <Card>
          <CardBody className="card-content">
            <Tabs aria-label="Project details tabs" defaultSelectedKey="info">
              <Tab key="info" title="Information">
                <div className="flex flex-col gap-3 py-4">
                  <div>
                    <span className="text-default-500 text-sm">Project ID:</span>
                    <p className="font-mono text-sm">{project.id}</p>
                  </div>
                  <div>
                    <span className="text-default-500 text-sm">Type:</span>
                    <p className="capitalize">{project.type}</p>
                  </div>
                  <div>
                    <span className="text-default-500 text-sm">Date:</span>
                    <p>{project.date}</p>
                  </div>
                </div>
              </Tab>

              {project.chatHistory && project.chatHistory.length > 0 && (
                <Tab key="chat" title={`Chat (${project.chatHistory.length})`}>
                  <ScrollShadow className="max-h-[400px] overflow-y-auto py-4">
                    <div className="flex flex-col gap-4">
                      {project.chatHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <Card
                            className={`max-w-[80%] ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-default-200 dark:bg-default-300"
                            }`}
                          >
                            <CardBody className="p-3 card-content">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {message.timestamp && (
                                <p className={`text-xs mt-1 opacity-70`}>
                                  {new Date(message.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </CardBody>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </ScrollShadow>
                </Tab>
              )}

              {project.videoData && (
                <Tab key="video" title="Video Settings">
                  <div className="flex flex-col gap-3 py-4">
                    <div>
                      <span className="text-default-500 text-sm">Duration:</span>
                      <p>{project.videoData.duration}s</p>
                    </div>
                    <div>
                      <span className="text-default-500 text-sm">Resolution:</span>
                      <p>{project.videoData.resolution}</p>
                    </div>
                    <div>
                      <span className="text-default-500 text-sm">Frame Rate:</span>
                      <p>{project.videoData.frameRate} fps</p>
                    </div>
                    <div>
                      <span className="text-default-500 text-sm">Aspect Ratio:</span>
                      <p>{project.videoData.aspectRatio}</p>
                    </div>
                  </div>
                </Tab>
              )}
            </Tabs>
          </CardBody>
        </Card>
      )}

      {!project.chatHistory && !project.videoData && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Project Information</h2>
          </CardHeader>
          <CardBody className="card-content">
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-default-500 text-sm">Project ID:</span>
                <p className="font-mono text-sm">{project.id}</p>
              </div>
              <div>
                <span className="text-default-500 text-sm">Type:</span>
                <p className="capitalize">{project.type}</p>
              </div>
              <div>
                <span className="text-default-500 text-sm">Date:</span>
                <p>{project.date}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="light" onPress={() => router.back()}>
          Back
        </Button>
        <Button
          as={NextLink}
          href="/"
          color="primary"
          variant="flat"
        >
          Home
        </Button>
      </div>
    </div>
  );
}

