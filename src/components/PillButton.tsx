import { ButtonHTMLAttributes } from "react";

type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

/**
 * Chunky rounded pill button matching the game's HUD aesthetic.
 * Rendered as a real <button> for accessibility (works with Enter/Space,
 * shows up in the accessibility tree as a button, focusable by default).
 */
export default function PillButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: PillButtonProps) {
  const variantClasses =
    variant === "primary"
      ? "bg-[#3FA9F5] text-black border-[#111111]"
      : "bg-[#3FA9F5] text-black border-[#111111]";

  return (
    <button
      {...props}
      className={`btn-pixel flex w-full items-center justify-center rounded-lg border-2 px-6 py-3 text-center text-base font-bold uppercase leading-none tracking-wide sm:rounded-xl sm:text-lg md:text-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-gold ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}