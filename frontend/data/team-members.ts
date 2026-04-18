export interface TeamMember {
  name: string;
  title: string;
  /** Profile URL (e.g. LinkedIn). */
  href: string;
}

/**
 * NFAS team roster for the site footer modal (order is display order).
 */
export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Ayodele Samuel",
    title: "Senior Software Engineer",
    href: "https://www.linkedin.com/in/ayodele-s-a0162116a/",
  },
  {
    name: "Abdulsemiu Sodiq Adeyemi",
    title: "Software Engineer",
    href: "https://www.linkedin.com/in/abdulsemiu-sodiq-55b6b5186",
  },
  {
    name: "Adegunlola Enoch Oluwaseyi",
    title: "Civil Engineer (GMNSE, MIAEng)",
    href: "https://www.linkedin.com/in/adegunlola-enoch-oluwaseyi-gmnse-miaeng-02995a235",
  },
];
