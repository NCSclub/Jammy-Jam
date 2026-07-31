"use client";

import PillButton from "@/components/PillButton";
import { siteConfig } from "@/config/site";

/**
 * The cursor pointing at Register Now, drawn as real pixel art: a 5x7 sprite
 * grid on an integer viewBox with crispEdges, so every cell stays a hard-edged
 * square at any size. Black outline, pink highlight down the lit upper edge,
 * grey body — same palette as the rest of the HUD sprites.
 */
function PixelCursor() {
  const OUTLINE = "#010101";
  const BODY = "#859099";
  const LIGHT = "#ffdbf7";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 5 7"
      shapeRendering="crispEdges"
      className="pointer-events-none absolute left-0 top-1/2 h-[28px] w-[20px] -translate-x-[130%] -translate-y-1/2 sm:h-[35px] sm:w-[25px]"
    >
      {/* body first, outline painted over it */}
      <rect x="1" y="2" width="1" height="1" fill={BODY} />
      <rect x="1" y="3" width="2" height="2" fill={BODY} />
      <rect x="1" y="5" width="1" height="1" fill={BODY} />
      <rect x="1" y="1" width="1" height="1" fill={LIGHT} />
      <rect x="2" y="2" width="1" height="1" fill={LIGHT} />

      <rect x="0" y="0" width="1" height="7" fill={OUTLINE} />
      <rect x="1" y="0" width="1" height="1" fill={OUTLINE} />
      <rect x="2" y="1" width="1" height="1" fill={OUTLINE} />
      <rect x="3" y="2" width="1" height="1" fill={OUTLINE} />
      <rect x="3" y="3" width="2" height="1" fill={OUTLINE} />
      <rect x="3" y="4" width="1" height="1" fill={OUTLINE} />
      <rect x="2" y="5" width="1" height="1" fill={OUTLINE} />
      <rect x="1" y="6" width="1" height="1" fill={OUTLINE} />
    </svg>
  );
}

export default function HeroActions() {
  return (
    <div className="mt-6 flex w-full max-w-[15rem] flex-col items-center gap-3 sm:mt-8 sm:max-w-xs sm:gap-4">
      <div className="relative w-full">
        <PixelCursor />
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