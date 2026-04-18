"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/** Keep in sync with `frontend/data/image-attributions.ts` (HOMEPAGE_BACKGROUND_CREDITS). */
const images = [
  "/flood_images/image1170x530cropped.jpg",
  "/flood_images/49aa56b0-1620-11f0-a367-317c298ca3ca.jpg.webp",
  "/flood_images/flood1.jpg",
  "/flood_images/486875278_4212896205597394_6660289909213668199_n.jpg",
  "/flood_images/FG-Warns-of-High-Flood-Risk-in-33-States.webp",
  "/flood_images/Flooded-Ala-Obaje-Community-Igalamela-LGA-Kogi-State.-Photo-The-ICIR..jpg",
];

const SWITCH_INTERVAL_MS = 6000;

export function BackgroundSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, SWITCH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          className={`object-cover transition-opacity duration-2000 ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {/* Black 50% scrim so light hero/footer text stays readable over photos */}
      <div className="absolute inset-0 z-1 bg-black/50" aria-hidden />
    </div>
  );
}
