import Image from "next/image";
import Navbar from "@/components/Navbar";
import CloudField from "@/components/CloudField";
import Countdown from "@/components/Countdown";
import HeroActions from "@/components/HeroActions";
import { siteConfig } from "@/config/site";
import { AboutUs } from "@/components/sections/about-us";
import { JammyJamByTheDigits } from "@/components/sections/jammy-jam-by-the-digits";
import { EventSchedule } from "@/components/sections/event-schedule";
import { Sponsors } from "@/components/sections/Sponsors";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        {/* Hero. Was its own <main> on the hero branch — demoted to a section
            so the page keeps a single <main> wrapping every section. */}
        <section
          id="home"
          className="relative flex min-h-svh flex-col overflow-hidden bg-gradient-to-b from-sky-top via-sky-mid to-sky-bottom"
        >
          <CloudField />
          <Navbar />

          <div
            aria-labelledby="hero-heading"
            className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-28 text-center sm:px-6 sm:pt-32 md:pt-36"
          >
            <h1
              id="hero-heading"
              className="relative mx-auto w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl"
            >
              <Image
                src="/Logo.svg"
                alt={siteConfig.name}
                width={900}
                height={520}
                priority
                className="h-auto w-full"
              />
            </h1>

            <p className="text-pixel-outline-thin-no-outline mt-3 max-w-md text-xs uppercase sm:mt-4 sm:text-sm md:text-base drop-shadow-[0_2px_0px_#E98F14]">
              {siteConfig.ctaHint.prefix}
              <span className="text-[#FCBF09]">
                {siteConfig.ctaHint.highlight}
              </span>
              {siteConfig.ctaHint.suffix}
            </p>

            <div id="register">
              <HeroActions />
            </div>

            <div className="mt-8 w-full max-w-md sm:mt-10 md:mt-12">
              <Countdown />
            </div>
          </div>
        </section>

        <AboutUs />
        <JammyJamByTheDigits />
        <EventSchedule />
        <Sponsors />
      </main>
      <Footer />
    </>
  );
}
