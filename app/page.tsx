import { AlertForm } from "@/frontend/components/alert-form";
import { BackgroundSlideshow } from "@/frontend/components/background-slideshow";
import { TrustedCarousel } from "@/frontend/components/trusted-carousel";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-orange-50 to-yellow-50 font-sans">
      <BackgroundSlideshow />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-8">
        {/* Header with Logo */}
        <header className="text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-orange-600 shadow-lg">
              <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <circle cx="9" cy="9" r="1"/>
                <circle cx="15" cy="9" r="1"/>
                <path d="M12 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-800 sm:text-3xl">
                Flood Sentinel Nigeria
              </h1>
              <p className="text-sm text-green-600">Protecting Farmers & Communities</p>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center max-w-3xl">
          <TrustedCarousel />
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Stay Ahead of Floods
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Get timely flood alerts for your Local Government Area. Receive warnings in plain language
            and multiple local languages to protect your crops, livestock, and community.
          </p>

          {/* Feature highlights */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-2 text-2xl">🌾</div>
              <h3 className="font-semibold text-gray-900">Farm Protection</h3>
              <p className="text-sm text-gray-600">Save your crops and livestock</p>
            </div>
            <div className="rounded-lg bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-2 text-2xl">🏘️</div>
              <h3 className="font-semibold text-gray-900">Community Alerts</h3>
              <p className="text-sm text-gray-600">Local language notifications</p>
            </div>
            <div className="rounded-lg bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="mb-2 text-2xl">⚡</div>
              <h3 className="font-semibold text-gray-900">Real-time Updates</h3>
              <p className="text-sm text-gray-600">7-day advance warnings</p>
            </div>
          </div>
        </section>

        <AlertForm />
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 mt-12 border-t border-green-200 bg-gradient-to-r from-green-50 to-orange-50 py-8">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-sm font-medium text-gray-800 mb-1">
            Built by the Sinitel Development Team
          </p>
          <p className="text-xs text-gray-600">
            Protecting Nigerian farmers from flood risks through innovative technology
          </p>
        </div>
      </footer>
    </div>
  );
}
