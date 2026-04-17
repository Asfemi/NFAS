import { AlertForm } from "@/frontend/components/alert-form";
import { BackgroundSlideshow } from "@/frontend/components/background-slideshow";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-12 font-sans text-zinc-100">
      <BackgroundSlideshow />
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-8">
        <section className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-200">
            Flood Sentinel Nigeria
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Nigeria Flood Alert System
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-200">
            Timely and actionable flood advisories for grassroots communities and
            farmers, delivered in plain language and multiple local languages.
          </p>
        </section>
        <AlertForm />
      </main>
    </div>
  );
}
