import type { Box } from "./geometry";


export type DigitCard = {

  id: string;

  frame: Box;

  bezelColor: string;

  icon: Box & { src: string };

  title: string;

  titleAt: { x: number; y: number };

  value: string;
  valueAt: { x: number; y: number };

  description: string;

  descriptionAt: { x: number; y: number; w: number };
};
