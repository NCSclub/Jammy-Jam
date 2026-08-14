"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ArcadeClock from "./arcade-clock";

/**
 * The clock and the hand-in button, while the desk is open.
 *
 * The page is server-rendered, so a tab left open at 11:40 still shows a live
 * button at 11:50. The API refuses that build and always did — but a team
 * should be told the desk is shut by the button going dead, not by an error
 * after they have chosen four files.
 *
 * So this watches the closing instant and, when it arrives, kills the button
 * and asks the server what it thinks. The refresh is the important half: the
 * browser's clock only decides what this page LOOKS like, and if the organizers
 * push the deadline back, that re-render is what brings the button back.
 *
 * `closesAt` is null whenever the doors are worked by hand from the dashboard.
 * There is no instant to watch then, so the button stays live until somebody
 * flips the switch — which is the whole point of the manual mode.
 */
export default function ArcadeDesk({
  deadline,
  closesAt,
}: {
  deadline: string;
  closesAt: string | null;
}) {
  const router = useRouter();
  const [shut, setShut] = useState(false);
  /* One refresh, not one per second: past the deadline every tick would fire
     another render of a page that is already saying the right thing. */
  const asked = useRef(false);

  useEffect(() => {
    if (!closesAt) return;
    const target = Date.parse(closesAt);
    if (Number.isNaN(target)) return;

    function check() {
      if (Date.now() < target) return;
      setShut(true);
      if (asked.current) return;
      asked.current = true;
      router.refresh();
    }

    check();
    const tick = setInterval(check, 1000);
    return () => clearInterval(tick);
  }, [closesAt, router]);

  if (shut) {
    return (
      <p className="arcade__closed" role="status">
        Submissions closed
      </p>
    );
  }

  return (
    <>
      <ArcadeClock deadline={deadline} />
      <Link className="arcade__cta" href="/submit">
        ▸ Submit your game
      </Link>
    </>
  );
}
