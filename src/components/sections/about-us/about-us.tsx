import { ABOUT_BOARD, WHAT_IS, type Piece } from "./content";
import "./about-us.css";

const ART = "/sections/about";
const HEADING_ID = "about-us-heading";

/* Five clouds, placed off the prototype: two down the left edge, three on the
   right. Every position below is the measured top edge as a percentage of the
   section, so they hold their spot as the section grows. */
const CLOUDS = [
  /* Big one on the left, flush with the edge so most of it is on screen. The
     prototype puts its top edge 19% down the section — level with the middle
     of the signboard — not up by the ledge. */
  {
    src: `${ART}/cloud-left.png`,
    style: { left: "0", top: "19%", width: "21%" },
    duration: "44s",
  },
  /* second left cloud, level with the WHAT IS block's heading. Anchored from
     the top rather than the ground so it holds that spot as the section grows */
  {
    src: `${ART}/cloud-left.png`,
    style: { left: "0", top: "56%", width: "20%" },
    duration: "52s",
  },
  /* Two puffs high on the right, running off the edge beside the ring. The art
     is already cropped flush on its right side, so right:0 shows all of it. */
  {
    src: `${ART}/cloud-right-top.png`,
    style: { right: "0", top: "6%", width: "11%" },
    duration: "50s",
  },
  /* Whole cloud level with the platform, tucked just in from the edge rather
     than bleeding off it — the one place in the section a cloud is uncut. */
  {
    src: `${ART}/cloud-right-mid.png`,
    style: { right: "1%", top: "52%", width: "17%" },
    duration: "46s",
  },
  /* big one on the right, flush with the edge and cut by the grass */
  {
    src: `${ART}/cloud-right.png`,
    style: { right: "0", bottom: "0", width: "27%" },
    duration: "48s",
  },
];

/* Rings in the sky. `fontSize` drives the ring's thickness, since the torus is
   built from em-based inset shadows. */
const RINGS = [
  { right: "17%", top: "6%", size: "clamp(36px, 3.4vw, 62px)" },
  { right: "19%", top: "37%", size: "clamp(32px, 3vw, 54px)" },
  { left: "3%", top: "46%", size: "clamp(34px, 3.2vw, 58px)" },
];

function Copy({ pieces }: { pieces: Piece[] }) {
  return (
    <p className="au__copy">
      {pieces.map((piece, index) => (
        <span key={index}>
          <span className={piece.tone}>{piece.text}</span>
          {/* the break is hidden on narrow screens, where forcing the
              prototype's line ending would leave a ragged short line */}
          {piece.breakAfter ? <br className="au__br" /> : null}
        </span>
      ))}
    </p>
  );
}

export function AboutUs() {
  return (
    <section id="about" className="au" aria-labelledby={HEADING_ID}>
      {CLOUDS.map((cloud, index) => (
        <img
          key={index}
          className="au__cloud"
          src={cloud.src}
          alt=""
          aria-hidden="true"
          style={{ ...cloud.style, animationDuration: cloud.duration }}
        />
      ))}

      {RINGS.map((ring, index) => (
        <img
          key={index}
          className="au__ring"
          src={`${ART}/ring.png`}
          alt=""
          aria-hidden="true"
          style={{
            left: ring.left,
            right: ring.right,
            top: ring.top,
            width: ring.size,
          }}
        />
      ))}

      {/* ledge clinging to the left edge, half off-screen like the mockup */}
      <img
        className="au__ledge"
        src={`${ART}/platform-small.png`}
        alt=""
        aria-hidden="true"
        style={{ left: "-2%", top: "5%", width: "7%" }}
      />

      {/* Tails flies in just left of the ABOUT US heading */}
      <img
        className="au__sprite au__sprite--float"
        src={`${ART}/tails.png`}
        alt=""
        aria-hidden="true"
        /* Fully inside the section. He used to sit at top:-1% to poke up into
           the hero, but .au clips its overflow (that is what crops the soil off
           the ground strip), so all that did was saw ~20% off his head against
           the section edge. 8px keeps him level with the seam and whole. */
        style={{ left: "37%", top: "8px", width: "7.5%" }}
      />

      {/* Eggman hangs off the right edge, level with the board */}
      <img
        className="au__sprite au__sprite--float"
        src={`${ART}/eggman.png`}
        alt=""
        aria-hidden="true"
        style={{ right: "-1%", top: "22%", width: "9%", animationDelay: "1.2s" }}
      />

      <h2 className="au__title au__title--about" id={HEADING_ID}>
        About us
      </h2>

      <div className="au__board-wrap">
        <div className="au__board">
          <Copy pieces={ABOUT_BOARD} />
        </div>
      </div>
      <div className="au__post" aria-hidden="true" />

      <img
        className="au__platform"
        src={`${ART}/platform-big.png`}
        alt=""
        aria-hidden="true"
      />

      <div className="au__what">
        <h2 className="au__title au__title--what">What is Jammy Jam</h2>
        <Copy pieces={WHAT_IS} />
      </div>

      {/* Shadow stands on the grass. Sonic, the ring row, the palm tree and the
          flower all live inside the ground strip below, so he is the only loose
          character left. He is anchored with a percentage margin rather than
          `bottom`, because a percentage `bottom` resolves against the section's
          height while the strip's grass line is a fraction of its WIDTH —
          3.55% puts his feet exactly where Sonic's are. `right: 26%` clears the
          flower, which the strip draws 18-23% in from the right edge. */}
      <img
        className="au__sprite"
        src={`${ART}/shadow.png`}
        alt=""
        aria-hidden="true"
        style={{ right: "26%", bottom: 0, marginBottom: "3.55%", width: "8%" }}
      />

      <img
        className="au__ground"
        src={`${ART}/ground.png`}
        alt=""
        aria-hidden="true"
      />
    </section>
  );
}
