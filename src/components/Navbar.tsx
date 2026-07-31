"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/config/site";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close on Escape, and trap focus inside the open mobile panel (Tab / Shift+Tab).
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && focusable.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="absolute inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6 md:px-8 md:pt-6">
      <nav
        aria-label="Primary"
        className="nav-pixel mx-auto flex max-w-6xl items-center justify-between bg-[#003cb4] px-6 py-3.5 sm:px-9 sm:py-4"
      >
        <a
          href="#home"
          className="text-pixel-outline-nav text-base uppercase font-bold sm:text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold "
        >
          {siteConfig.name}
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex lg:gap-8">
          {siteConfig.navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-pixel-outline-nav-desk text-base font-semibold uppercase tracking-wide transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:text-lg"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburger toggle (mobile / tablet) */}
        <button
          ref={toggleButtonRef}
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="relative flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full border-2 border-white/80 bg-blue/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:hidden"
        >
          <motion.span
            className="block h-0.5 w-6 rounded bg-white"
            animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          />
          <motion.span
            className="block h-0.5 w-6 rounded bg-white"
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
          />
          <motion.span
            className="block h-0.5 w-6 rounded bg-white"
            animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          />
        </button>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-20 bg-navy-dark/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              onClick={closeMenu}
              aria-hidden="true"
            />
            <motion.div
              id={menuId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="relative z-30 mx-auto mt-3 max-w-7xl overflow-hidden rounded-3xl border-2 border-white/70 bg-navy/90 backdrop-blur-sm md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeInOut" }}
            >
              <ul className="flex flex-col gap-1 p-4">
                {siteConfig.navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={closeMenu}
                      className="text-pixel-outline-thin block rounded-xl px-3 py-3 text-base font-semibold uppercase tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
