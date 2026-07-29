
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { DIGIT_CARDS } from "./content";
import { DigitCardItem } from "./digit-card";
import {
  BLEED,
  CANVAS_WIDTH,
  CANVAS_WIDTH_VAR,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  DECOR,
  HEADING,
  INK_LIFT,
  box,
  checkerStyle,
  s,
  u,
  w,
} from "./geometry";
import type { DigitCard } from "./types";

const HEADING_ID = "jammy-jam-by-the-digits-heading";
const ART = "/sections/digits";

const DECOR_LAYERS = [
  { key: "grass-bottom-left", src: `${ART}/grass.svg`, rect: DECOR.grassBottomLeft, pixelated: false },
  { key: "grass-upper", src: `${ART}/grass.svg`, rect: DECOR.grassTopRightUpper, pixelated: false },
  { key: "grass-lower", src: `${ART}/grass.svg`, rect: DECOR.grassTopRightLower, pixelated: false },
] as const;

type JammyJamByTheDigitsProps = {
  cards?: readonly DigitCard[];
  className?: string;
};

export function JammyJamByTheDigits({
  cards = DIGIT_CARDS,
  className,
}: JammyJamByTheDigitsProps) {
  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        containerType: "inline-size",
        [CANVAS_WIDTH_VAR]: CANVAS_WIDTH,
      } as CSSProperties}
    >
      
      <div className="absolute inset-0" style={checkerStyle()} />

      <img
        src={`${ART}/road.svg`}
        alt=""
        aria-hidden="true"
        className="absolute block max-w-none"
        style={{
          left: w(BLEED.road.left),
          top: s(BLEED.road.top),
          width: w(BLEED.road.width),
          height: s(BLEED.road.height),
        }}
      />

      
      <img
        src={`${ART}/knuckles.png`}
        alt=""
        aria-hidden="true"
        className="absolute block max-w-none"
        style={{
          left: w(BLEED.knuckles.left),
          top: s(BLEED.knuckles.top),
          width: s(BLEED.knuckles.w),
          height: s(BLEED.knuckles.h),
          imageRendering: "pixelated",
        }}
      />

      <section
        aria-labelledby={HEADING_ID}
        
        className="relative mx-auto w-full"
        style={{
        
          maxWidth: DESIGN_WIDTH,
          containerType: "inline-size",
          aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
          fontFamily: "var(--font-sonic-hud)",
        }}
      >
        {DECOR_LAYERS.map(({ key, src, rect, pixelated }) => (
          <img
            key={key}
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute block max-w-none"
            style={{ ...box(rect), imageRendering: pixelated ? "pixelated" : undefined }}
          />
        ))}

        <h2
          id={HEADING_ID}
          className="absolute uppercase whitespace-nowrap"
          style={{
            left: u(HEADING.frame.x),
            top: u(HEADING.frame.y),
            color: HEADING.color,
            fontSize: u(HEADING.fontSize),
            letterSpacing: HEADING.letterSpacing,
            lineHeight: u(HEADING.fontSize),
            transform: `translateY(${INK_LIFT})`,
            textShadow: `0 ${u(4)} 0 ${HEADING.shadow}`,
          }}
        >
          Jammy Jam by Digits
        </h2>

       
        <ul className="absolute inset-0 list-none">
          {cards.map((card) => (
            <DigitCardItem key={card.id} card={card} />
          ))}
        </ul>
      </section>


      <img
        src={`${ART}/rouge_sign.png`}
        alt=""
        aria-hidden="true"
        className="absolute block max-w-none"
        style={{
          left: s(BLEED.rougeSign.left),
          top: s(BLEED.rougeSign.top),
          width: s(BLEED.rougeSign.w),
          height: s(BLEED.rougeSign.h),
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
