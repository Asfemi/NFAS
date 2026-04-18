import { AlertForm } from "@/frontend/components/alert-form";
import { BackgroundSlideshow } from "@/frontend/components/background-slideshow";
import { HomeHero } from "@/frontend/components/home-hero";
import { SiteFooter } from "@/frontend/components/site-footer";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden px-4 pb-28 pt-12 font-sans text-zinc-100">
      <BackgroundSlideshow />
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-8">
        <HomeHero />
        <AlertForm />
      </main>
      <SiteFooter />
    </div>
  );
}
