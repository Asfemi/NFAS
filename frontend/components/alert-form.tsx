"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

export function AlertForm() {
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
    <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="lga" className="block text-sm font-semibold text-zinc-800">
          Local Government Area (LGA)
        </label>
        {directoryError ? (
          <p className="text-sm text-amber-800">{directoryError}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="lga"
            value={lga}
            onChange={(event) => setLga(event.target.value)}
            list="lga-options"
            placeholder={placeholder}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none ring-0 focus:border-zinc-500"
          />
          <datalist id="lga-options">
            {knownLgas.map((entry) => (
              <option key={entry} value={entry} />
            ))}
          </datalist>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-zinc-900 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-500"
          >
            {loading ? "Generating..." : "Get Alert"}
          </button>
        </div>
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
                  <div className="mt-3 block w-full min-w-0 space-y-3 border-t border-zinc-200/90 pt-3 text-zinc-600">
                    <p>
                      River discharge is for the Open-Meteo model grid near (
                      {result.openMeteo.gridLatitude.toFixed(3)}°,{" "}
                      {result.openMeteo.gridLongitude.toFixed(3)}°) — requested LGA point (
                      {result.openMeteo.requestedLatitude.toFixed(3)}°,{" "}
                      {result.openMeteo.requestedLongitude.toFixed(3)}°).
                    </p>
                    <p>
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

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-zinc-200 p-4">
            <div
              role="tablist"
              aria-label="Seasonal outlook language"
              className="mb-3 flex gap-1 border-b border-zinc-200 pb-0"
            >
              <button
                type="button"
                role="tab"
                id="outlook-tab-en"
                aria-selected={outlookTab === "en"}
                aria-controls="outlook-panel"
                onClick={() => setOutlookTab("en")}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
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
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  outlookTab === "local"
                    ? "border border-b-0 border-zinc-200 bg-white text-zinc-900 -mb-px"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                {regionalLabels[result.localLanguage]}
              </button>
            </div>
            <article
              role="tabpanel"
              id="outlook-panel"
              aria-labelledby={
                outlookTab === "en" ? "outlook-tab-en" : "outlook-tab-local"
              }
            >
              <div className="mb-2 flex justify-end">
                <span className="text-xs text-zinc-400">
                  {outlookTab === "en"
                    ? `${result.outlook.en.length} chars`
                    : `${result.outlook.local.length} chars`}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                {outlookTab === "en" ? result.outlook.en : result.outlook.local}
              </p>
            </article>
          </div>
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                setAlertsModalNonce((n) => n + 1);
                setAlertsModalOpen(true);
              }}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
            >
              Get alerts
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <PersonalizedAlertsModal
          key={`${result.record.lga}-${alertsModalNonce}`}
          open={alertsModalOpen}
          lga={result.record.lga}
          onClose={() => setAlertsModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
