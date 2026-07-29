import { JammyJamByTheDigits } from "@/components/sections/jammy-jam-by-the-digits";
import { EventSchedule } from "@/components/sections/event-schedule";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <JammyJamByTheDigits />
      <EventSchedule />
    </main>
  );
}
