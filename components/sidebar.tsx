"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Link } from "@heroui/link";
import NextLink from "next/link";

interface HistoryItem {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "feature" | "fix" | "update" | "refactor";
}

const projectHistory: HistoryItem[] = [
  {
    id: "1",
    date: "2024-01-15",
    title: "Initial Project Setup",
    description: "Created Next.js project with HeroUI integration",
    type: "feature",
  },
  {
    id: "2",
    date: "2024-01-16",
    title: "Added Navigation Bar",
    description: "Implemented responsive navbar with theme switching",
    type: "feature",
  },
  {
    id: "3",
    date: "2024-01-17",
    title: "Fixed Layout Issues",
    description: "Resolved mobile responsiveness problems",
    type: "fix",
  },
  {
    id: "4",
    date: "2024-01-18",
    title: "Simplified Navbar",
    description: "Removed complex features, kept essential navigation",
    type: "refactor",
  },
  {
    id: "5",
    date: "2024-01-19",
    title: "Added Project History Sidebar",
    description: "Created sidebar component to track project milestones",
    type: "feature",
  },
];


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isMobile = false,
}) => {
  const content = (
    <>
      <DrawerHeader className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Project History</h2>
        <p className="text-small text-default-500">
          Timeline of project milestones and updates
        </p>
      </DrawerHeader>
      <DrawerBody>
        <ScrollShadow className="max-h-[calc(100vh-200px)]">
          <div className="flex flex-col gap-2">
            {projectHistory.map((item) => (
              <Link
                key={item.id}
                as={NextLink}
                href={`/project/${item.id}`}
                className="block p-2 rounded-lg hover:bg-default-100 transition-colors"
                onPress={onClose}
              >
                <span className="text-sm">{item.title}</span>
              </Link>
            ))}
          </div>
        </ScrollShadow>
      </DrawerBody>
      <DrawerFooter>
        <Button color="default" variant="light" onPress={onClose}>
          Close
        </Button>
      </DrawerFooter>
    </>
  );

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} placement="left">
        <DrawerContent>{content}</DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Always visible sidebar
  return (
    <div className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-content1 border-r border-divider z-30">
      <div className="flex flex-col h-full w-full">
        <div className="p-4 border-b border-divider">
          <h2 className="text-xl font-semibold">Project History</h2>
          <p className="text-small text-default-500">
            Timeline of project milestones
          </p>
        </div>
        <ScrollShadow className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {projectHistory.map((item) => (
              <Link
                key={item.id}
                as={NextLink}
                href={`/project/${item.id}`}
                className="block p-2 rounded-lg hover:bg-default-100 transition-colors"
              >
                <span className="text-sm">{item.title}</span>
              </Link>
            ))}
          </div>
        </ScrollShadow>
      </div>
    </div>
  );
};

