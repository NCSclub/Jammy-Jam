import { LavaDecor } from "./lava-decor/lava-decor";

const GEMS = "/sections/Sponsors/Gems";

/* Every asset is sized in vw with a floor and a ceiling so the composition
   holds its proportions from 320px up, rather than sitting at the PNG's
   intrinsic size and swallowing a phone screen. */
const GEM = "h-auto w-[clamp(26px,6vw,50px)]";

/** A pair of emeralds flanking the logo, one on each side. */
function GemPair({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex w-full max-w-lg items-center justify-between px-[8%]">
      <img src={`${GEMS}/${left}-Gem.png`} alt="" aria-hidden="true" className={GEM} />
      <img src={`${GEMS}/${right}-Gem.png`} alt="" aria-hidden="true" className={GEM} />
    </div>
  );
}

export function Sponsors() {
    return(
        <section
            id="sponsors"
            aria-label="Our sponsor"
            className="relative scroll-mt-24 overflow-hidden bg-[linear-gradient(180deg,#010103_0%,#030305_27.79%,#380104_48.55%,#4B0308_59.21%,#65040B_66.92%,#811008_76%,#B44902_87.67%,#E67906_100%)] px-4 pt-[clamp(48px,10vw,80px)] pb-[clamp(64px,12vw,120px)]"
        >
           <LavaDecor />

           {/* one centred column: everything lines up from a single rule
               instead of five separate mx-auto / justify-between blocks */}
           <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-[clamp(18px,4vw,34px)]">

            <h2
                className="whitespace-nowrap text-center text-[clamp(2.1rem,8vw,5rem)] font-bold leading-none text-white"
                style={{ textShadow: "3px 3px 0px hsla(92, 81%, 42%, 1)" }}
            >
                Our Sponsor
            </h2>

            {/* no `whitespace-nowrap`: at the 1.25rem floor this sentence is
                wider than a phone and drags the whole page sideways */}
            <p
                className="max-w-2xl text-balance text-center text-[clamp(1.05rem,3.25vw,2rem)] font-semibold leading-snug tracking-wide text-white"
                style={{ textShadow: "2px 2px 0px hsla(92, 81%, 42%, 1)" }}
            >
                Proudly sponsored by our host institution:
            </p>

            {/* The yellow emerald sits centred with the rest of the set; Sonic
                flies in from the far left, level with it. He is absolutely
                positioned inside this row rather than placed in the section,
                so his vertical alignment follows the gem automatically instead
                of depending on a hand-tuned offset.

                `hidden sm:block` keeps him off phones entirely — below 640px he
                is the widest thing on screen and crowds the logo. */}
            {/* Full-bleed row so Sonic can sit near the section's own edge
                rather than the column's, which on a wide screen is hundreds of
                pixels in. `w-screen` alone is enough: the parent column is
                `items-center`, so an oversized child overflows it evenly on
                both sides and ends up centred on the viewport. Adding
                `left-1/2 -translate-x-1/2` on top measured the 50% against the
                narrow column instead of the viewport, which shunted the whole
                row sideways and pushed Sonic out of the clipped section. */}
            <div className="relative flex w-screen items-center justify-center">
                <img
                    src="/sections/Sponsors/yellow-sonic.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute left-[clamp(6px,4vw,80px)] top-1/2 hidden h-auto w-[clamp(72px,17vw,124px)] -translate-y-1/2 sm:block"
                />
                <img
                    src={`${GEMS}/Yellow-Gem.png`}
                    alt=""
                    aria-hidden="true"
                    className="h-auto w-[clamp(44px,10vw,74px)]"
                />
            </div>

            <GemPair left="Red" right="Blue" />

            <img
                src="/sections/Sponsors/Nit-Sponsors-logo.png"
                alt="Numidia Institute of Technology"
                className="block h-auto w-[clamp(165px,45vw,330px)]"
            />

            <GemPair left="Cyan" right="Green" />

            <img
                src={`${GEMS}/Purple-Gem.png`}
                alt=""
                aria-hidden="true"
                className={GEM}
            />

            </div>

        </section>
    )
}
