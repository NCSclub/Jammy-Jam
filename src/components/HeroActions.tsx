"use client";

import PillButton from "@/components/PillButton";
import { siteConfig } from "@/config/site";

export default function HeroActions() {
  return (
    <div className="mt-6 flex w-full max-w-[15rem] flex-col items-center gap-3 sm:mt-8 sm:max-w-xs sm:gap-4">
      <div className="relative w-full">
        <span
          aria-hidden="true"
          className="text-pixel-outline-thin pointer-events-none absolute left-0 top-1/2 flex h-8 w-6 -translate-x-[130%] -translate-y-1/2 items-center justify-center text-lg sm:h-9 sm:w-7 sm:text-xl"
        >
          ▶
        </span>
        <PillButton
          onClick={() => {
            window.location.hash = siteConfig.registerHref;
          }}
        >
          Register Now
        </PillButton>
      </div>

      <PillButton
        onClick={() => {
          window.location.hash = siteConfig.scheduleHref;
        }}
      >
        Schedule
      </PillButton>
    </div>
  );
}