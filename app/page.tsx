import { AlertForm } from "@/frontend/components/alert-form";
import { BackgroundSlideshow } from "@/frontend/components/background-slideshow";
import { HomeHero } from "@/frontend/components/home-hero";
import { SiteFooter } from "@/frontend/components/site-footer";

export default function Home() {
  return (
    <div className="relative min-h-dvh min-h-screen overflow-x-hidden px-3 pt-10 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] font-sans text-zinc-100 sm:px-4 sm:pt-12 sm:pb-28">
      <BackgroundSlideshow />
      <main className="relative z-10 mx-auto flex w-full min-w-0 max-w-4xl flex-col items-center gap-6 sm:gap-8">
        <HomeHero />
        <AlertForm />
      </main>
      <SiteFooter />
    </div>
  );
}
