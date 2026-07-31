
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
  TYPE,
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
      className={cn("jjd relative w-full overflow-hidden", className)}
      style={{
        containerType: "inline-size",
        [CANVAS_WIDTH_VAR]: CANVAS_WIDTH,
      } as CSSProperties}
    >

      <div className="absolute inset-0" style={checkerStyle()} />

      {/* Phones get a stacked list instead of the scaled canvas below. The
          canvas is a 1440px design shrunk by cqw, so at 375px wide its body
          text lands at ~9px — proportionally correct and completely
          unreadable. Same content, same palette, laid out to be read. */}
      <ul className="jjd__stack">
        <li className="jjd__stack-head">
          <h2 style={{ color: HEADING.color, letterSpacing: HEADING.letterSpacing }}>
            Jammy Jam by Digits
          </h2>
        </li>
        {cards.map((card) => (
          <li key={card.id} className="jjd__card" style={{ borderColor: card.bezelColor }}>
            <img src={card.icon.src} alt="" aria-hidden="true" />
            <div>
              <h3 style={{ color: TYPE.titleColor }}>{card.title}</h3>
              <strong style={{ color: TYPE.bodyColor }}>{card.value}</strong>
              <p style={{ color: TYPE.bodyColor }}>{card.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <img
        src={`${ART}/road.svg`}
        alt=""
        aria-hidden="true"
        className="jjd__bleed absolute block max-w-none"
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
        className="jjd__bleed absolute block max-w-none"
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
        className="jjd__canvas relative mx-auto w-full"
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
        className="jjd__bleed absolute block max-w-none"
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
