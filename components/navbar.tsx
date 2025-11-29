"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import NextLink from "next/link";

import { siteConfig } from "@/config/site";
import { Logo, HistoryIcon } from "@/components/icons";

interface NavbarProps {
  onSidebarToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle }) => {
  return (
    <HeroUINavbar
      maxWidth="full"
      position="static"
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#030012]/85 backdrop-blur-2xl shadow-[0_15px_45px_rgba(98,22,255,0.4)]"
    >
      <NavbarContent className="w-full gap-6" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex items-center gap-3" href="/">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl text-white shadow-[0_0_25px_rgba(255,75,216,0.4)]">
              <Logo />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-gradient text-lg font-semibold tracking-wide">
                {siteConfig.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.45em] text-white/60">
                AI Music Gifts
              </span>
            </div>
          </NextLink>
        </NavbarBrand>
        <div className="hidden lg:flex items-center gap-6 ml-8 text-sm font-medium">
          {siteConfig.navItems.map((item) => (
            <NextLink
              key={item.href}
              href={item.href}
              className="text-white/70 transition hover:text-white"
            >
              {item.label}
            </NextLink>
          ))}
        </div>
        <div className="ml-auto hidden md:block">
          <NextLink
            href="/project/create"
            className="neon-button px-6 py-3 text-xs uppercase tracking-[0.2em]"
          >
            Zacznij Tworzyć
          </NextLink>
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Button
            isIconOnly
            variant="light"
            aria-label="Project History"
            onPress={onSidebarToggle}
            className="bg-white/10 text-white"
          >
            <HistoryIcon size={20} />
          </Button>
          <NavbarMenuToggle className="text-white" />
        </div>
      </NavbarContent>

      <NavbarMenu className="backdrop-blur-2xl">
        <div className="mx-4 mt-4 flex flex-col gap-3">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item.href}-${index}`}>
              <Link
                as={NextLink}
                color="foreground"
                href={item.href}
                size="lg"
                className="text-white/80 hover:text-white"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <NextLink href="/project/create" className="neon-button w-full text-center">
              Zacznij Tworzyć
            </NextLink>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
