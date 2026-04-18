"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PersonalizedAlertsModal } from "@/frontend/components/personalized-alerts-modal";

type RegionalLanguageCode = "ha" | "yo" | "ig";

interface LgaDirectoryEntry {
  lga: string;
  state: string;
  localLanguage: RegionalLanguageCode;
}

interface OpenMeteoFloodDay {
  date: string;
  riverDischargeMaxM3s: number;
}

interface OpenMeteoFloodForecast {
  requestedLatitude: number;
  requestedLongitude: number;
  gridLatitude: number;
  gridLongitude: number;
  dischargeUnit: string;
  forecastDays: number;
  days: OpenMeteoFloodDay[];
  peakDischargeM3s: number;
  peakDate: string;
  riskLevel: "low" | "medium" | "high";
}

interface AlertResponse {
  record: {
    lga: string;
    state: string;
    risk_level: "low" | "medium" | "high";
    timeframe: string;
  };
  localLanguage: RegionalLanguageCode;
  alerts: {
    en: string;
    local: string;
  };
  outlook: {
    en: string;
    local: string;
  };
  openMeteo: OpenMeteoFloodForecast;
  personalized?: boolean;
}

const regionalLabels: Record<RegionalLanguageCode, string> = {
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

const resultsStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
};

const resultsItem = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function AlertForm() {
  const reduce = useReducedMotion();
  const [lga, setLga] = useState("");
  const [directory, setDirectory] = useState<LgaDirectoryEntry[]>([]);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [result, setResult] = useState<AlertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [alertsModalNonce, setAlertsModalNonce] = useState(0);
  const [outlookTab, setOutlookTab] = useState<"en" | "local">("en");

  useEffect(() => {
    async function loadLgas() {
      const response = await fetch("/api/lgas");
      const payload = (await response.json()) as {
        items?: LgaDirectoryEntry[];
        lgas?: string[];
        error?: string;
      };
      if (!response.ok) {
        setDirectory([]);
        setDirectoryError(payload.error ?? "Could not load the LGA list.");
        return;
      }
      setDirectoryError(null);
      setDirectory(payload.items ?? []);
    }

    loadLgas().catch(() => {
      setDirectory([]);
      setDirectoryError("Could not load the LGA list.");
    });
  }, []);

  const knownLgas = useMemo(() => {
    const names = directory.map((entry) => entry.lga);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [directory]);

  const autoLanguage = useMemo(() => {
    const trimmed = lga.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }
    const exact = directory.find((entry) => entry.lga.toLowerCase() === trimmed);
    if (exact) {
      return exact.localLanguage;
    }
    const partial = directory.find(
      (entry) =>
        entry.lga.toLowerCase().includes(trimmed) ||
        trimmed.includes(entry.lga.toLowerCase()),
    );
    return partial?.localLanguage ?? null;
  }, [lga, directory]);

  const languageForHint = useMemo(
    () => autoLanguage ?? result?.localLanguage ?? null,
    [autoLanguage, result],
  );

  const placeholder = useMemo(
    () =>
      knownLgas.length ? `Try: ${knownLgas.slice(0, 3).join(", ")}` : "e.g. Lokoja",
    [knownLgas],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAlertsModalOpen(false);
    setResult(null);

    if (!lga.trim()) {
      setError("Enter an LGA to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lga }),
      });

      const payload = (await response.json()) as
        | AlertResponse
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in payload ? payload.error : "Could not generate alert.";
        setError(message ?? "Could not generate alert.");
        return;
      }

      setOutlookTab("en");
      setResult(payload as AlertResponse);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="w-full min-w-0 max-w-3xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6"
      initial={reduce ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0.15 }
          : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label
          htmlFor="lga"
          className="block text-sm font-semibold leading-snug text-zinc-800 sm:leading-normal"
        >
          Local Government Area (LGA)
        </label>
        {directoryError ? (
          <p className="text-sm text-amber-800">{directoryError}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            id="lga"
            value={lga}
            onChange={(event) => setLga(event.target.value)}
            list="lga-options"
            placeholder={placeholder}
            className="min-h-11 w-full min-w-0 rounded-xl border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 outline-none ring-0 focus:border-zinc-500 sm:min-h-0 sm:px-4 sm:py-3"
          />
          <datalist id="lga-options">
            {knownLgas.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <motion.button
            type="submit"
            disabled={loading}
            className="min-h-11 w-full shrink-0 rounded-xl bg-zinc-900 px-5 py-3 text-base font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-500 sm:w-auto sm:min-h-0 sm:text-sm"
            whileTap={reduce ? {} : { scale: 0.97 }}
            animate={
              loading && !reduce
                ? {
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(24,24,27,0.4)",
                      "0 0 0 12px rgba(24,24,27,0)",
                      "0 0 0 0 rgba(24,24,27,0)",
                    ],
                  }
                : { scale: 1 }
            }
            transition={
              loading && !reduce
                ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
                : {}
            }
          >
            {loading ? "Analyzing Risk…" : "Get Status"}
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {loading ? (
            <motion.div
              key="alert-loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: reduce ? 0.1 : 0.2 }}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-2.5 text-sm leading-snug text-zinc-600"
            >
              <span className="inline-flex items-center gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="inline-block h-2 w-2 rounded-full bg-zinc-600"
                    animate={
                      reduce ? {} : { y: [0, -8, 0], opacity: [0.4, 1, 0.4] }
                    }
                    transition={{
                      repeat: reduce ? 0 : Infinity,
                      duration: 0.5,
                      delay: i * 0.12,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </span>
              <span>Looking up your LGA, fetching live river data, and drafting your advisory…</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {languageForHint ? (
          <div className="text-sm leading-relaxed text-zinc-600">
            <span>
              Local SMS language for this area:{" "}
              <span className="font-semibold text-zinc-800">
                {regionalLabels[languageForHint]}
              </span>{" "}
              (with English).
            </span>
            {result ? (
              <>
                {" "}
                <details
                  key={`forecast-details-${result.record.lga}-${result.record.state}`}
                  className="inline align-baseline [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="inline list-none cursor-pointer bg-transparent p-0 text-sm font-normal leading-relaxed text-zinc-600 shadow-none ring-0 hover:text-zinc-800 hover:underline hover:underline-offset-4 focus:outline-none focus-visible:text-zinc-800 focus-visible:underline">
                    forecast details
                  </summary>
                  <div className="mt-3 block w-full min-w-0 space-y-3 overflow-x-auto border-t border-zinc-200/90 pt-3 text-sm text-zinc-600 sm:text-base">
                    <p className="min-w-0 wrap-break-word">
                      River discharge is for the Open-Meteo model grid near (
                      {result.openMeteo.gridLatitude.toFixed(3)}°,{" "}
                      {result.openMeteo.gridLongitude.toFixed(3)}°) — requested LGA point (
                      {result.openMeteo.requestedLatitude.toFixed(3)}°,{" "}
                      {result.openMeteo.requestedLongitude.toFixed(3)}°).
                    </p>
                    <p className="min-w-0 wrap-break-word">
                      Peak ensemble-max discharge:{" "}
                      <span className="font-medium text-zinc-800">
                        {result.openMeteo.peakDischargeM3s.toFixed(0)}{" "}
                        {result.openMeteo.dischargeUnit}
                      </span>{" "}
                      on {result.openMeteo.peakDate}.
                    </p>
                    <div>
                      <h3 className="mb-2 font-semibold text-zinc-800">
                        Daily river discharge max ({result.openMeteo.forecastDays} days)
                      </h3>
                      <ul className="grid gap-1 sm:grid-cols-2">
                        {result.openMeteo.days.map((d) => (
                          <li
                            key={d.date}
                            className="flex justify-between gap-2 rounded-lg bg-zinc-50/80 px-2 py-1 text-zinc-600"
                          >
                            <span>{d.date}</span>
                            <span className="font-mono text-zinc-800">
                              {d.riverDischargeMaxM3s.toFixed(0)} {result.openMeteo.dischargeUnit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              </>
            ) : null}
          </div>
        ) : null}
      </form>

      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key={error}
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: reduce ? 0.12 : 0.22 }}
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key={`${result.record.lga}-${result.record.state}-results`}
            className="mt-6 space-y-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14, transition: { duration: 0.18 } }}
            transition={
              reduce
                ? { duration: 0.18 }
                : { type: "spring", damping: 16, stiffness: 260, mass: 0.85 }
            }
          >
            <motion.div
              className="min-w-0 rounded-xl border border-zinc-200 p-3 sm:p-4"
              variants={resultsStagger}
              initial="hidden"
              animate="show"
            >
            <div
              role="tablist"
              aria-label="Seasonal outlook language"
              className="mb-3 flex min-w-0 flex-wrap gap-1 border-b border-zinc-200 pb-0"
            >
              <button
                type="button"
                role="tab"
                id="outlook-tab-en"
                aria-selected={outlookTab === "en"}
                aria-controls="outlook-panel"
                onClick={() => setOutlookTab("en")}
                className={`min-h-10 min-w-0 flex-1 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:px-4 ${
                  outlookTab === "en"
                    ? "border border-b-0 border-zinc-200 bg-white text-zinc-900 -mb-px"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                role="tab"
                id="outlook-tab-local"
                aria-selected={outlookTab === "local"}
                aria-controls="outlook-panel"
                onClick={() => setOutlookTab("local")}
                className={`min-h-10 min-w-0 flex-1 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:px-4 ${
                  outlookTab === "local"
                    ? "border border-b-0 border-zinc-200 bg-white text-zinc-900 -mb-px"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                {regionalLabels[result.localLanguage]}
              </button>
            </div>
            <motion.article
              role="tabpanel"
              id="outlook-panel"
              aria-labelledby={
                outlookTab === "en" ? "outlook-tab-en" : "outlook-tab-local"
              }
              variants={resultsItem}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={outlookTab}
                  initial={{ opacity: 0, x: reduce ? 0 : outlookTab === "en" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduce ? 0 : outlookTab === "en" ? 8 : -8 }}
                  transition={{ duration: reduce ? 0.12 : 0.2 }}
                >
                  <div className="mb-2 flex justify-end">
                    <span className="text-xs text-zinc-400">
                      {outlookTab === "en"
                        ? `${result.outlook.en.length} chars`
                        : `${result.outlook.local.length} chars`}
                    </span>
                  </div>
                  <p className="min-w-0 wrap-break-word text-sm leading-relaxed whitespace-pre-wrap text-zinc-700">
                    {outlookTab === "en" ? result.outlook.en : result.outlook.local}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.article>
          </motion.div>
          <motion.div
            className="flex justify-center pt-2"
            variants={resultsItem}
            initial="hidden"
            animate="show"
          >
            <motion.button
              type="button"
              onClick={() => {
                setAlertsModalNonce((n) => n + 1);
                setAlertsModalOpen(true);
              }}
              className="min-h-11 w-full max-w-sm rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 sm:min-h-0 sm:w-auto"
              whileHover={reduce ? {} : { scale: 1.03, y: -1 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              Get alerts
            </motion.button>
          </motion.div>
        </motion.div>
        ) : null}
      </AnimatePresence>

      {result ? (
        <PersonalizedAlertsModal
          key={`${result.record.lga}-${alertsModalNonce}`}
          open={alertsModalOpen}
          lga={result.record.lga}
          onClose={() => setAlertsModalOpen(false)}
        />
      ) : null}
    </motion.div>
  );
}