
import { CARD, INK_LIFT, TYPE, box, u } from "./geometry";
import type { DigitCard } from "./types";
const textShadow = (color: string) => `0 ${u(TYPE.shadowOffset)} 0 ${color}`;
const border = `${u(CARD.borderWidth)} solid ${CARD.borderColor}`;
export function DigitCardItem({ card }: { card: DigitCard }) {
  const { frame, bezelColor, icon, title, titleAt, value, valueAt, description, descriptionAt } =
    card;

  return (
    <li className="absolute list-none" style={box(frame)}>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: bezelColor, border, borderRadius: u(CARD.radius) }}
      />
      <div
        className="absolute"
        style={{
          ...box(CARD.inner),
          backgroundColor: CARD.innerColor,
          border,
          borderRadius: u(CARD.radius),
        }}
      />

      <img
        src={icon.src}
        alt=""
        aria-hidden="true"
        className="absolute block"
        style={box(icon)}
      />

      <h3
        className="absolute uppercase whitespace-nowrap"
        style={{
          left: u(titleAt.x),
          top: u(titleAt.y),
          color: TYPE.titleColor,
          fontSize: u(TYPE.titleSize),
          letterSpacing: TYPE.letterSpacing,
          lineHeight: u(TYPE.titleSize),
          transform: `translateY(${INK_LIFT})`,
          textShadow: textShadow(TYPE.shadow),
        }}
      >
        {title}
      </h3>

      <p
        className="absolute uppercase whitespace-nowrap"
        style={{
          left: u(valueAt.x),
          top: u(valueAt.y),
          color: TYPE.bodyColor,
          fontSize: u(TYPE.valueSize),
          letterSpacing: TYPE.letterSpacing,
          lineHeight: u(TYPE.valueSize),
          transform: `translateY(${INK_LIFT})`,
          textShadow: textShadow(TYPE.shadow),
        }}
      >
        {value}
      </p>

      <p
        className="absolute uppercase [word-break:break-word]"
        style={{
          left: u(descriptionAt.x),
          top: u(descriptionAt.y),
          width: u(descriptionAt.w),
          color: TYPE.bodyColor,
          fontSize: u(TYPE.descSize),
          letterSpacing: TYPE.letterSpacing,
          lineHeight: u(TYPE.descLineHeight),
          transform: `translateY(${INK_LIFT})`,
          textShadow: textShadow(TYPE.shadow),
        }}
      >
        {description}
      </p>
    </li>
  );
}
