import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-gray-800">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-gray-800 sm:items-start">
        <section className="flex flex-col w-full gap-2">
          <Textarea />
          <Button variant="default">Submit</Button>
        </section>
      </main>
    </div>
  );
}
