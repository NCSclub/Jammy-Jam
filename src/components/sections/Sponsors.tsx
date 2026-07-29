import { LavaDecor } from "./lava-decor/lava-decor";

export function Sponsors() {
    return(
        <section
            id="sponsors"
            aria-label="Our sponsor"
            className="relative min-h-95 scroll-mt-24 overflow-hidden bg-[linear-gradient(180deg,#010103_0%,#030305_27.79%,#380104_48.55%,#4B0308_59.21%,#65040B_66.92%,#811008_76%,#B44902_87.67%,#E67906_100%)] py-20 sm:min-h-140"
        >
           <LavaDecor />

           <div className="section-shell min-h-75 sm:min-h-120">
            <div className="flex items-center justify-center gap-4 sm:gap-14">
            
            <h2 
                className="whitespace-nowrap text-center text-[clamp(2.1rem,8vw,5rem)] font-bold text-white leading-none"
                style={{
                    color: "white",
                    textShadow: "3px 3px 0px hsla(92, 81%, 42%, 1)",
                }}
            >
                Our Sponsor
            </h2>
            
            </div>

            <div className="site-plus-decor absolute left-[clamp(1rem,4vw,3.5rem)] top-11.5 text-2xl font-light leading-none text-white sm:left-[25.5%] sm:top-22.5 sm:text-4xl">
            
            </div>

            <p 
                className="mx-auto mt-10 mb-25 max-w-none whitespace-nowrap text-center text-[clamp(1.25rem,3.25vw,2.25rem)] font-semibold leading-snug tracking-wide text-white"
                style={{
                    color: "white",
                    textShadow: "2px 2px 0px hsla(92, 81%, 42%, 1)",
                }}
            >
                Proudly sponsored by our host institution:
            </p>
            <div className="my-4 flex items-center relative overflow-hidden">
                <img
                    src="/Sections/Sponsors/Gems/Yellow-Gem.png"
                    alt="Yellow Gem"
                    className=" mx-auto h-auto w-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />

                <img
                    src="/Sections/Sponsors/yellow-sonic.png"
                    alt="Yellow sonic"
                    className="h-auto w-auto ml-10 "
                />

            </div>

                <div className="flex justify-between items-center my-6 px-[16%]">
                    <img
                        src="/Sections/Sponsors/Gems/Red-Gem.png"
                        alt="Red Gem"
                        className="block"
                    />

                    <img
                        src="/Sections/Sponsors/Gems/Blue-Gem.png"
                        alt="Blue Gem"
                        className="block"
                    />
                </div>

                <img
                    src="/Sections/Sponsors/Nit-Sponsors-logo.png"
                    alt="Nit logo"
                    className="mx-auto block h-auto w-auto "
                />

                <div className="flex justify-between items-center my-6 px-[16%]">
                    <img
                        src="/Sections/Sponsors/Gems/Cyan-Gem.png"
                        alt="Cyan Gem"
                        className="block"
                    />

                    <img
                        src="/Sections/Sponsors/Gems/Green-Gem.png"
                        alt="Green Gem"
                        className="block"
                    />
                </div>

                <img
                    src="/Sections/Sponsors/Gems/Purple-Gem.png"
                    alt="Purple Gem"
                    className="my-4 mx-auto block h-auto w-auto"
                />

            <div className="relative isolate mx-auto mt-[clamp(28px,8vw,55px)] grid h-37.5 w-[clamp(230px,32vw,377px)] place-items-center">
            
            
            </div>

            
            </div>
        
        </section>
    )
}