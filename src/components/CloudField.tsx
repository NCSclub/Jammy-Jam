import Image from "next/image";

type Cloud = {
  className: string;
  width: number;
  height: number;
};

type Cloudt7t = {
  className: string;
  width: number;
  height: number;
};

// Positions are tuned to echo the reference layout: two clouds tucked into
// the upper corners, two larger ones resting along the bottom edge.
const CLOUDS: Cloud[] = [
  {
    className: "left-[-4%] top-[6%] w-[26vw] max-w-[240px] opacity-95",
    width: 600,
    height: 340,
  },
  {
    className: "right-[-6%] top-[10%] w-[34vw] max-w-[620px] opacity-95",
    width: 600,
    height: 340,
  }
]

const CLOUDST7T: Cloudt7t[] = [
  {
    className: "left-[-6%] bottom-[12%] w-[30vw] max-w-[360px] opacity-95",
    width: 600,
    height: 340,
  },
  {
    className: "right-[10%] bottom-[2%] w-[36vw] max-w-[440px] opacity-95",
    width: 600,
    height: 340,
  },
];

export default function CloudField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {CLOUDS.map((cloud, i) => (
        <Image
          key={i}
          src="/cloud.svg"
          alt=""
          width={cloud.width}
          height={cloud.height}
          className={`absolute h-auto ${cloud.className}`}
          priority={i < 2}
        />
      ))}

            {CLOUDST7T.map((cloudt7t, i) => (
        <Image
          key={i}
          src="/cloud.svg"
          alt=""
          width={cloudt7t.width}
          height={cloudt7t.height}
          className={`absolute h-auto ${cloudt7t.className}`}
          priority={i < 2}
        />
      ))}
    </div>
  );
}