import "./lava-decor.css";

const ART = "/sections/schedule";

/* Placed to match the sponsors mockup: orbs drifting up the sides and middle,
   ember sparks in the corners. Percentages, so they hold as the section
   grows or shrinks. */
const PIECES = [
  { art: "lava-orb", kind: "orb", style: { left: "6%", top: "4%", width: "18px" }, delay: "0s" },
  { art: "ember-cluster", kind: "spark", style: { right: "3%", top: "17%", width: "26px" }, delay: "1.2s" },
  { art: "lava-orb", kind: "orb", style: { right: "9%", top: "43%", width: "15px" }, delay: "2.4s" },
  { art: "lava-orb", kind: "orb", style: { left: "15%", top: "66%", width: "22px" }, delay: "0.8s" },
  { art: "lava-orb", kind: "orb", style: { right: "11%", top: "73%", width: "28px" }, delay: "3.1s" },
  { art: "lava-orb", kind: "orb", style: { left: "35%", top: "88%", width: "16px" }, delay: "1.7s" },
  { art: "ember-cluster", kind: "spark", style: { right: "15%", bottom: "3%", width: "24px" }, delay: "2.2s" },
  { art: "spark-star", kind: "spark", style: { left: "8%", top: "34%", width: "30px" }, delay: "0.5s" },
] as const;

export function LavaDecor() {
  return (
    <div className="lava-decor" aria-hidden="true">
      {PIECES.map((piece, index) => (
        <img
          key={`${piece.art}-${index}`}
          className={piece.kind}
          src={`${ART}/${piece.art}.png`}
          alt=""
          style={{ ...piece.style, animationDelay: piece.delay }}
        />
      ))}
    </div>
  );
}
