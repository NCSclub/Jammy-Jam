import { Press_Start_2P, VT323 } from "next/font/google";

/**
 * The two faces the pixel pages share: a blocky display font for headings and
 * labels, a tall terminal font for body copy.
 *
 * They are declared once here and pulled in by any route that needs them, so a
 * new page cannot quietly ship a different pair. The CSS variable names match
 * the ones registration-form.css already expects.
 */

export const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-pixel",
});

export const bodyFont = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--jj-font-body",
});

/** Drop on the outermost element of a page to make both fonts available. */
export const pixelFontVars = `${pixelFont.variable} ${bodyFont.variable}`;
