"use client";

import * as React from "react";
import clsx from "clsx";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <Navbar onSidebarToggle={toggleSidebar} />
      <Sidebar
        isOpen={isMobile ? isSidebarOpen : true}
        onClose={closeSidebar}
        isMobile={isMobile}
      />
      <div
        className={clsx(
          "transition-all duration-300 ease-in-out",
          "md:ml-80", // Always add left margin on desktop since sidebar is always visible
          "pt-16" // Add top padding to account for fixed navbar
        )}
      >
        {children}
      </div>
    </>
  );
}

