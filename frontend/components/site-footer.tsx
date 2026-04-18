"use client";

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedDialog } from "@/frontend/components/animated-dialog";
import { HOMEPAGE_BACKGROUND_CREDITS } from "@/frontend/data/image-attributions";
import { TEAM_MEMBERS } from "@/frontend/data/team-members";

function useModalEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

const listContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

function AttributionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  useModalEscape(open, onClose);

  return (
    <AnimatedDialog open={open} onClose={onClose} labelledBy={titleId}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
          Attributions
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <motion.ul
        className="space-y-4 text-sm text-zinc-700"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        <motion.li variants={listItem}>
          <p className="font-semibold text-zinc-900">Local government areas and coordinates</p>
          <p className="mt-1 leading-relaxed">
            Ward-level coordinates aggregated to LGA centroids from{" "}
            <a
              href="https://github.com/temikeezy/nigeria-geojson-data"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
              target="_blank"
              rel="noreferrer"
            >
              Nigeria GeoJSON Data
            </a>{" "}
            (MIT), via the hosted dataset described in the project documentation.
          </p>
        </motion.li>
        <motion.li variants={listItem}>
          <p className="font-semibold text-zinc-900">River discharge and flood risk signals</p>
          <p className="mt-1 leading-relaxed">
            Simulated river discharge from the Global Flood Awareness System (GloFAS), accessed
            through the{" "}
            <a
              href="https://open-meteo.com/en/docs/flood-api"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
              target="_blank"
              rel="noreferrer"
            >
              Open-Meteo Flood API
            </a>
            .
          </p>
        </motion.li>
        <motion.li variants={listItem}>
          <p className="font-semibold text-zinc-900">Optional SMS delivery</p>
          <p className="mt-1 leading-relaxed">
            When configured, outbound SMS may use{" "}
            <a
              href="https://sms-gate.app/"
              className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
              target="_blank"
              rel="noreferrer"
            >
              SMSGate
            </a>{" "}
            (Android SMS Gateway).
          </p>
        </motion.li>
        <motion.li variants={listItem}>
          <p className="font-semibold text-zinc-900">Homepage background photography</p>
          <p className="mt-1 leading-relaxed">
            Full-screen images in the homepage slideshow were gathered from the open web (news
            outlets, agencies, and documentary-style flood photography). They are used for
            illustration only; NFAS does not claim copyright. For production, confirm licences and
            prefer images you control or have explicit permission to use.
          </p>
          <ul className="mt-3 space-y-2.5 border-t border-zinc-100 pt-3 text-xs text-zinc-600">
            {HOMEPAGE_BACKGROUND_CREDITS.map((row) => (
              <li key={row.path}>
                <span className="font-medium text-zinc-800">{row.shortLabel}</span>
                {row.link ? (
                  <>
                    {" · "}
                    <a
                      href={row.link}
                      className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.linkLabel ?? "Learn more"}
                    </a>
                  </>
                ) : null}
                <span className="mt-0.5 block font-normal leading-relaxed">{row.credit}</span>
              </li>
            ))}
          </ul>
        </motion.li>
      </motion.ul>
    </AnimatedDialog>
  );
}

function TeamModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId();
  useModalEscape(open, onClose);

  return (
    <AnimatedDialog open={open} onClose={onClose} labelledBy={titleId}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
          NFAS team
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <p className="mb-4 text-sm text-zinc-600">
        Tap a name to open their profile (LinkedIn or other link they provided).
      </p>
      <motion.ul
        className="space-y-2"
        variants={listContainer}
        initial="hidden"
        animate="show"
      >
        {TEAM_MEMBERS.map((member) => (
          <motion.li key={member.name} variants={listItem}>
            <a
              href={member.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
            >
              <span className="font-semibold text-zinc-900">{member.name}</span>
              <span className="mt-0.5 block text-sm text-zinc-600">{member.title}</span>
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </AnimatedDialog>
  );
}

export function SiteFooter() {
  const [teamOpen, setTeamOpen] = useState(false);
  const [attributionOpen, setAttributionOpen] = useState(false);

  return (
    <>
      <footer className="pointer-events-auto fixed bottom-0 left-0 right-0 z-20 flex flex-col gap-2 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0px))] sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-4 sm:py-3 sm:pb-3">
        <div className="min-w-0 text-left text-xs text-zinc-200/95 sm:text-sm">
          <button
            type="button"
            onClick={() => {
              setTeamOpen(false);
              setAttributionOpen(true);
            }}
            className="min-h-10 w-full rounded-md bg-transparent p-2 text-left text-inherit underline decoration-zinc-400/80 underline-offset-4 transition-colors hover:text-white hover:decoration-white sm:min-h-0 sm:w-auto sm:p-0"
          >
            Attributions
          </button>
        </div>
        <div className="min-w-0 text-left text-xs text-zinc-200/95 sm:text-right sm:text-sm">
          <button
            type="button"
            onClick={() => {
              setAttributionOpen(false);
              setTeamOpen(true);
            }}
            className="min-h-10 w-full rounded-md bg-transparent p-2 text-left text-pretty text-inherit underline decoration-zinc-400/80 underline-offset-4 transition-colors hover:text-white hover:decoration-white sm:min-h-0 sm:w-auto sm:p-0 sm:text-right"
          >
            Made with much love by the awesome NFAS team
          </button>
        </div>
      </footer>
      <AttributionModal
        open={attributionOpen}
        onClose={() => setAttributionOpen(false)}
      />
      <TeamModal open={teamOpen} onClose={() => setTeamOpen(false)} />
    </>
  );
}
