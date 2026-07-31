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

            {/* Sonic carrying the emerald — decoration, so phones drop it
                entirely: below 640px it is the widest thing in the column and
                crowds the logo. `hidden sm:flex` rather than a CSS media query
                so it never renders at all on a phone.

                The two of them are a flex pair because they used to be a
                centred-absolute gem sitting on top of an in-flow Sonic, which
                overlapped him at every width. */}
            <div className="hidden items-center justify-center gap-[clamp(2px,1.5vw,14px)] sm:flex">
                <img
                    src="/sections/Sponsors/yellow-sonic.png"
                    alt=""
                    aria-hidden="true"
                    className="h-auto w-[clamp(72px,17vw,124px)]"
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
