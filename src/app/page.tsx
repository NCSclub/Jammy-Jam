import { JammyJamByTheDigits } from "@/components/sections/jammy-jam-by-the-digits";
import { Sponsors } from "@/components/sections/Sponsors";
import { Footer } from "@/components/layout/Footer"

export default function Home() {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <JammyJamByTheDigits />
        <Sponsors />
      </main>
      <Footer />
    </>
  );
}
