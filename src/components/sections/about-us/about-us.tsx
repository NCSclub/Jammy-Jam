import { ABOUT_BOARD, WHAT_IS, type Piece } from "./content";
import "./about-us.css";

const ART = "/sections/about";
const HEADING_ID = "about-us-heading";

/* The two big pixel clouds bleed off the left and right edges, exactly as in
   the prototype: one high on the left, one low on the right sitting down on
   the grass. Everything else is a smaller filler cloud. */
const CLOUDS = [
  /* big one on the left, flush with the edge so most of it is on screen */
  {
    src: `${ART}/cloud-left.png`,
    style: { left: "0", top: "5%", width: "21%" },
    duration: "44s",
  },
  /* second left cloud, level with the WHAT IS block's heading. Anchored from
     the top rather than the ground so it holds that spot as the section grows */
  {
    src: `${ART}/cloud-left.png`,
    style: { left: "0", top: "56%", width: "20%" },
    duration: "52s",
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
        style={{ left: "37%", top: "-1%", width: "7.5%" }}
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

      {/* Sonic and Shadow stand on the grass, feet just above the blades */}
      <img
        className="au__sprite"
        src={`${ART}/sonic-emerald.png`}
        alt=""
        aria-hidden="true"
        style={{ left: "12%", bottom: "34px", width: "9%" }}
      />
      <img
        className="au__sprite"
        src={`${ART}/shadow.png`}
        alt=""
        aria-hidden="true"
        style={{ right: "16%", bottom: "34px", width: "8%" }}
      />

      {/* the row of rings along the grass */}
      {[0, 1, 2, 3].map((index) => (
        <img
          key={`floor-ring-${index}`}
          className="au__ring"
          src={`${ART}/ring.png`}
          alt=""
          aria-hidden="true"
          style={{
            left: `${31 + index * 7.5}%`,
            bottom: "52px",
            width: "clamp(40px, 4vw, 74px)",
          }}
        />
      ))}

      <div className="au__ground" aria-hidden="true" />
    </section>
  );
}
