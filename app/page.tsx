"use client";

import { useState } from "react";
import NextLink from "next/link";
import clsx from "clsx";

type Option = {
  value: string;
  label: string;
  icon?: string;
  variant?: "ghost";
};

const OCCASION_OPTIONS: Option[] = [
  { value: "birthday", label: "Urodziny", icon: "🎂" },
  { value: "anniversary", label: "Rocznica / Związek", icon: "💍" },
  { value: "christmas", label: "Święta", icon: "🎄" },
  { value: "roast", label: "Roast", icon: "😂" },
  { value: "other", label: "Inna...", icon: "✨", variant: "ghost" },
];

const RELATION_OPTIONS: Option[] = [
  { value: "partner", label: "❤️ Partner" },
  { value: "friend", label: "🧸 Przyjaciel" },
  { value: "parent", label: "👪 Rodzic" },
];

const VIBE_OPTIONS: Option[] = [
  { value: "rock", label: "🎸 Rock" },
  { value: "pop", label: "🎤 Pop" },
  { value: "rap", label: "🧢 Rap" },
  { value: "other", label: "+ Inny" },
];

interface OptionGroupProps {
  index: number;
  title: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  subtitle?: string;
}

const OptionGroup = ({ index, title, subtitle, options, value, onChange }: OptionGroupProps) => (
  <div className="space-y-4">
    <div>
      <p className="neon-section-title">{index}. {title}</p>
      {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            "option-pill",
            option.variant === "ghost" && "option-pill--ghost",
            value === option.value && "is-active",
          )}
        >
          {option.icon && <span className="text-lg">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default function Home() {
  const [occasion, setOccasion] = useState("birthday");
  const [relation, setRelation] = useState("partner");
  const [vibe, setVibe] = useState("pop");
  const [recipientName, setRecipientName] = useState("");

  return (
    <section className="relative min-h-[calc(100vh-6rem)] w-full px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#0c0022]/85 via-[#050015]/92 to-[#080024]/90 p-6 sm:p-10 shadow-[0_45px_140px_rgba(90,9,146,0.55)]">
          <div className="absolute -top-32 -left-10 h-72 w-72 blurred-spot bg-[#ff4bd8]" />
          <div className="absolute -bottom-20 -right-10 h-64 w-64 blurred-spot bg-[#5a7bff]" />

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.45em] text-white/60">
              <span className="rounded-full border border-white/30 px-4 py-1 text-white/80">GiftTune</span>
              <span className="rounded-full border border-pink-400/60 px-3 py-1 text-pink-200">AI</span>
              <span>Personalizowane utwory</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-gradient sm:text-5xl">
                Stwórz Hit dla Bliskiej Osoby
              </h1>
              <p className="text-lg text-white/75 max-w-2xl">
                Wybierz okazję, dodaj imię i pozwól GiftTune.ai zaskoczyć Twoich najbliższych personalizowaną piosenką.
              </p>
            </div>

            <div className="neon-panel flex flex-col gap-8">
              <OptionGroup
                index={1}
                title="Okazja?"
                options={OCCASION_OPTIONS}
                value={occasion}
                onChange={setOccasion}
              />

              <div className="glow-divider" />

              <div className="space-y-4">
                <p className="neon-section-title">2. Dla kogo?</p>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Wpisz imię..."
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    className="neon-input"
                  />
                  <div className="flex flex-wrap gap-3">
                    {RELATION_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRelation(option.value)}
                        className={clsx(
                          "option-pill",
                          relation === option.value && "is-active",
                        )}
                      >
                        <span className="text-lg">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glow-divider" />

              <OptionGroup
                index={3}
                title="Vibe muzyczny?"
                options={VIBE_OPTIONS}
                value={vibe}
                onChange={setVibe}
              />

              <NextLink href="/project/create" className="neon-button w-full justify-center text-sm">
                Dalej
              </NextLink>
            </div>
          </div>

          <div className="absolute right-8 top-8 hidden sm:block">
            <div className="relative rounded-3xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold tracking-[0.6em] text-white">
              AI
              <span className="pointer-events-none absolute inset-0 -z-10 blur-2xl" style={{ background: "radial-gradient(circle, rgba(255,75,216,0.45), transparent 60%)" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
