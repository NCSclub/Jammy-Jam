import { JammyJamByTheDigits } from "@/components/sections/jammy-jam-by-the-digits";
import { EventSchedule } from "@/components/sections/event-schedule";
import { Sponsors } from "@/components/sections/Sponsors";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <JammyJamByTheDigits />
        <EventSchedule />
        <Sponsors />
      </main>
      <Footer />
    </>
  );
}
