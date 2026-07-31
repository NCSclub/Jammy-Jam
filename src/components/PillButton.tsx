import { ButtonHTMLAttributes } from "react";

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Chunky pixel button matching the game's HUD aesthetic: the corners, outline
 * and drop shadow all live in .btn-pixel (globals.css) because the stepped
 * shape is a clip-path — no rounded/border utilities here, they'd be clipped.
 * Rendered as a real <button> for accessibility (works with Enter/Space,
 * shows up in the accessibility tree as a button, focusable by default).
 */
export default function PillButton({
  className = "",
  children,
  ...props
}: PillButtonProps) {
  return (
    <button
      {...props}
      className={`btn-pixel flex w-full items-center justify-center px-7 py-4 text-center text-base font-bold uppercase leading-none tracking-wide sm:text-lg md:text-xl ${className}`}
    >
      {children}
    </button>
  );
}
