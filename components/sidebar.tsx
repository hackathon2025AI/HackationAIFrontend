"use client";

import * as React from "react";
import { Drawer, DrawerContent } from "@heroui/drawer";
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
}

const typeMeta = {
  feature: {
    label: "Feature",
    badge: "border-pink-400/40 bg-pink-500/10 text-pink-100",
  },
  fix: {
    label: "Fix",
    badge: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  },
  update: {
    label: "Update",
    badge: "border-sky-400/40 bg-sky-500/10 text-sky-100",
  },
  refactor: {
    label: "Refactor",
    badge: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  },
} satisfies Record<HistoryItem["type"], { label: string; badge: string }>;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const renderPanel = () => (
    <div className="neon-panel neon-panel--muted flex h-full flex-col gap-5 rounded-[26px] border border-white/15 bg-[#050017]/95 p-5 shadow-[0_35px_120px_rgba(84,18,140,0.35)]">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/55">
          Historia
        </p>
        <h2 className="text-2xl font-semibold text-white">Project History</h2>
        <p className="text-sm text-white/70">
          Najważniejsze etapy rozwoju GiftTune.ai
        </p>
      </div>

      <ScrollShadow className="flex-1" dir="rtl">
        <div className="flex flex-col gap-3 pl-2" dir="ltr">
          {projectHistory.map((item) => {
            const meta = typeMeta[item.type];

            return (
              <Link
                key={item.id}
                as={NextLink}
                className="group flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white/80 transition hover:border-white/25 hover:bg-white/10 card-content"
                href={`/project/${item.id}`}
                onPress={onClose}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                  {formatDate(item.date)}
                </p>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-white/60">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </ScrollShadow>

      <Button
        className="self-end rounded-full border border-white/20 bg-white/5 text-white"
        variant="light"
        onPress={onClose}
      >
        Zamknij
      </Button>
    </div>
  );

  return (
    <Drawer
      classNames={{
        base: "bg-transparent",
      }}
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
    >
      <DrawerContent className="bg-[#03000f]/90 p-4">
        {renderPanel()}
      </DrawerContent>
    </Drawer>
  );
};
