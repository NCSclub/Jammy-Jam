import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

import type { CSSProperties } from "react";

export function Footer() {
  const footerStyle: CSSProperties = {
  width: "100%",
  minHeight: "200px",
  backgroundImage:
    "url('/sections/Footer/Footerbg.svg'), linear-gradient(180deg, #010103 0%, #030305 27.79%, #380104 48.55%, #4B0308 59.21%, #65040B 66.92%, #811008 76%, #B44902 87.67%, #E67906 100%)",
  backgroundRepeat: "repeat-x, no-repeat",
  backgroundPosition: "center calc(100% + 2px), center", 
  backgroundSize: "auto 100%, cover",
};

  return (
    <footer
      id="contact"
      className="relative z-10 px-4 pb-8 pt-2 text-white sm:px-6 lg:px-8 somic-font"
      style={{ minHeight: '100vh', ...footerStyle }}
    >
      
      <div className="pointer-events-none absolute inset-x-2 top-0 z-20 mx-auto flex max-w-6xl -translate-y-8/9 justify-start px-4 sm:px-6 lg:px-8">
        <img
          src="/sections/Footer/Footerscreen.svg"
          alt="Footer screen"
          className="h-auto w-40 sm:w-52"
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 py-8 md:flex-row">
        {/* Logo */}
        <div className="flex justify-start">
          <img
            src="/sections/Footer/Footerlogo.svg"
            alt="JammyJam logo"
            className="h-auto w-40 sm:w-52"
          />
        </div>

        {/* Contact */}
        <div className="flex flex-col items-start">
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            Contact us
          </h2>

          <a
            href="mailto:numidiacomputersociety@gmail.com"
            target="_blank"
            className="mt-4 flex items-center gap-3 text-base underline decoration-white/70 underline-offset-4 sm:text-lg"
          >
            <FaEnvelope className="size-6 shrink-0 text-[#beb8ba]" />
            <span>numidiacomputersociety@gmail.com</span>
          </a>

          <a 
            href="https://maps.app.goo.gl/wzvM7PCzP5rRARCL7"
            target="_blank"
            className="mt-3 flex items-center gap-3 text-base font-medium tracking-wide sm:text-lg"
          >
            <FaMapMarkerAlt className="size-6 shrink-0 text-[#beb8ba]" />
            <span>Numidia Institute of Technology , Algeria</span>
          </a>

          <a
          href="tel:+213553383984"
            className="mt-3 flex items-center gap-3 text-base font-medium tracking-wide sm:text-lg"
          >
            <FaPhoneAlt className="size-6 shrink-0 text-[#beb8ba]" />
            <span>Call Us: +213 553 383 984</span>
          </a>
        </div>

      </div>

      <p className="mx-auto mt-4 max-w-4xl text-center text-base leading-relaxed text-white sm:text-lg">
        &copy; 2026 NCSHACK. All rights reserved. Organized by Numidia Computer
        Society
      </p>
    </footer>
  );
}