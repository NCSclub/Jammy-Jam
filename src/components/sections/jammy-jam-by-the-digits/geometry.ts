import type { CSSProperties } from "react";
export const DESIGN_WIDTH = 1440;
export const DESIGN_HEIGHT = 2205;

export type Box = { x: number; y: number; w: number; h: number };
export function u(px: number): string {
  return `${(px / DESIGN_WIDTH) * 100}cqw`;
}

export function box(b: Box): CSSProperties {
  return { left: u(b.x), top: u(b.y), width: u(b.w), height: u(b.h) };
}

export const CHECKER = {
  tile: 35,
  originX: -6,
  dark: "#300401",
  light: "#7f3002",
} as const;

const checkerImage = `repeating-conic-gradient(${CHECKER.light} 0% 25%, ${CHECKER.dark} 0% 50%)`;

export const CANVAS_WIDTH_VAR = "--canvas-w";

export const CANVAS_WIDTH = `min(100cqw, ${DESIGN_WIDTH}px)`;

export function s(px: number): string {
  return `calc(var(${CANVAS_WIDTH_VAR}) * ${px} / ${DESIGN_WIDTH})`;
}
export function w(px: number): string {
  return `calc(100cqw * ${px} / ${DESIGN_WIDTH})`;
}

export function checkerStyle(): CSSProperties {
  const v = `var(${CANVAS_WIDTH_VAR})`;
  return {
    backgroundColor: CHECKER.dark,
    backgroundImage: checkerImage,
    backgroundSize: `${s(CHECKER.tile * 2)} ${s(CHECKER.tile * 2)}`,
    backgroundPosition: `calc((100cqw - ${v}) / 2 + ${v} * ${CHECKER.originX} / ${DESIGN_WIDTH}) 0`,
  };
}


export const BLEED = {
 
  road: {
    left: -107,
    width: 1635.59375,
    top: 610.2,
    height: 1003.14,
  },

  knuckles: {
    left: 1250.73291015625,
    top: 1386.81201171875,
    w: 155.2534968683467,
    h: 163.9879225100958,
  },

  rougeSign: { left: -4, top: 1700, w: 223, h: 210 },
} as const;

export const DECOR = {
  grassBottomLeft: { x: -418, y: 1907, w: 608.6380615234375, h: 193.2701873779297 },
  grassTopRightUpper: { x: 1322, y: 63, w: 608.6380615234375, h: 193.2701873779297 },
  grassTopRightLower: { x: 1179, y: 218, w: 608.6380615234375, h: 193.2701873779297 },
} as const satisfies Record<string, Box>;


export const HEADING = {
  frame: { x: 389, y: 10, w: 673, h: 60 },
  color: "#8ae71a",
  fontSize: 60,
  shadow: "black",

  letterSpacing: "0.1em",
} as const;
export const INK_LIFT = "-0.132em";

export const TYPE = {
  titleColor: "#f9fea6",
  bodyColor: "#fffdd4",
  shadow: "#ca790a",
  shadowOffset: 4,
  titleSize: 60,
  valueSize: 80,
  descSize: 35,
  descLineHeight: 50,

  letterSpacing: "0.075em",
} as const;

export const CARD = {
  size: { w: 617, h: 460 },
  borderWidth: 5,
  borderColor: "#000000",
  radius: 15,
  inner: { x: 29, y: 30, w: 560, h: 400 },
  innerColor: "#010101",
} as const;
