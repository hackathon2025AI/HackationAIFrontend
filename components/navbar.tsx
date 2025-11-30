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
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { HistoryIcon } from "@/components/icons";

interface NavbarProps {
  onSidebarToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSidebarToggle }) => {
  return (
    <HeroUINavbar
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#030012]/85 backdrop-blur-2xl shadow-[0_15px_45px_rgba(98,22,255,0.4)]"
      maxWidth="full"
      position="static"
    >
      <NavbarContent className="w-full gap-6" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex items-center gap-3" href="/">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl text-white shadow-[0_0_25px_rgba(255,75,216,0.4)] overflow-hidden">
              <Image
                priority
                alt="GiftBeat logo"
                height={44}
                src="/logov1.png"
                width={44}
              />
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
              className="text-white/70 transition hover:text-white"
              href={item.href}
            >
              {item.label}
            </NextLink>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            isIconOnly
            aria-label="Project History"
            className="bg-white/10 text-white"
            variant="light"
            onPress={onSidebarToggle}
          >
            <HistoryIcon size={20} />
          </Button>
          <NextLink
            className="neon-button px-6 py-3 text-xs uppercase tracking-[0.2em] hidden md:inline-flex"
            href="/"
          >
            Zacznij Tworzyć
          </NextLink>
          <NavbarMenuToggle className="text-white md:hidden" />
        </div>
      </NavbarContent>

      <NavbarMenu className="backdrop-blur-2xl">
        <div className="mx-4 mt-4 flex flex-col gap-3">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item.href}-${index}`}>
              <Link
                as={NextLink}
                className="text-white/80 hover:text-white"
                color="foreground"
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <NextLink className="neon-button w-full text-center" href="/">
              Zacznij Tworzyć
            </NextLink>
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
