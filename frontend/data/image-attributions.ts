/**
 * Credits for homepage background rotator images (`BackgroundSlideshow`).
 * Keep `path` order in sync with `frontend/components/background-slideshow.tsx`.
 * Replace or extend `link` when you have the exact article or licence page.
 */
export interface BackgroundImageCredit {
  path: string;
  shortLabel: string;
  credit: string;
  /** Organisation or article URL when known. */
  link?: string;
  /** Short anchor text for `link` (defaults to “Learn more”). */
  linkLabel?: string;
}

export const HOMEPAGE_BACKGROUND_CREDITS: BackgroundImageCredit[] = [
  {
    path: "/flood_images/image1170x530cropped.jpg",
    shortLabel: "Flood scene (cropped)",
    credit:
      "Sourced from online news / documentary photography of flooding (original outlet not recorded in the filename).",
  },
  {
    path: "/flood_images/49aa56b0-1620-11f0-a367-317c298ca3ca.jpg.webp",
    shortLabel: "Flood imagery",
    credit: "Obtained online; rights remain with the original photographer or publisher.",
  },
  {
    path: "/flood_images/flood1.jpg",
    shortLabel: "Flood waters",
    credit: "Sourced from online stock or news imagery; used here for illustration only.",
  },
  {
    path: "/flood_images/486875278_4212896205597394_6660289909213668199_n.jpg",
    shortLabel: "Community flood (social)",
    credit:
      "Image style consistent with social/news platforms; original page not archived in this repo—verify before commercial reuse.",
  },
  {
    path: "/flood_images/FG-Warns-of-High-Flood-Risk-in-33-States.webp",
    shortLabel: "33 states flood risk advisory",
    credit:
      "Federal / seasonal flood-risk advisory graphic as reproduced in Nigerian online media (e.g. NIHSA–style seasonal outlooks).",
    link: "https://nema.gov.ng/",
    linkLabel: "NEMA (context)",
  },
  {
    path: "/flood_images/Flooded-Ala-Obaje-Community-Igalamela-LGA-Kogi-State.-Photo-The-ICIR..jpg",
    shortLabel: "Ala-Obaje, Igalamela LGA, Kogi State",
    credit:
      "Flooded Ala-Obaje community — photograph credited in the filename to The ICIR (International Centre for Investigative Reporting).",
    link: "https://www.icirnigeria.org/",
    linkLabel: "The ICIR",
  },
];
