"use client";

import * as React from "react";
import clsx from "clsx";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      <Navbar onSidebarToggle={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div
        className={clsx(
          "transition-all duration-300 ease-in-out",
          "pt-16", // Add top padding to account for fixed navbar
        )}
      >
        {children}
      </div>
    </>
  );
}
