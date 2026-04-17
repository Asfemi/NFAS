"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type LanguageCode = "en" | "ha" | "yo" | "ig";

interface LGAOption {
  lga: string;
  state: string;
  latitude: number;
  longitude: number;
}

interface AlertResponse {
  record: {
    lga: string;
    state: string;
    risk_level: "low" | "medium" | "high";
    timeframe: string;
  };
  alerts: Record<LanguageCode, string>;
}

const languageLabels: Record<LanguageCode, string> = {
  en: "English",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

export function AlertForm() {
  const [lga, setLga] = useState("");
  const [knownLgas, setKnownLgas] = useState<LGAOption[]>([]);
  const [result, setResult] = useState<AlertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLgas() {
      try {
        const response = await fetch("/api/lgas?format=full");
        if (!response.ok) throw new Error("Failed to fetch LGAs");

        const payload = (await response.json()) as {
          metadata?: Record<string, unknown>;
          lgas?: LGAOption[]
        };

        // Ensure we have an array of objects with lga and state properties
        if (Array.isArray(payload.lgas)) {
          setKnownLgas(payload.lgas.filter(entry => entry?.lga && entry?.state));
        } else {
          setKnownLgas([]);
        }
      } catch (err) {
        console.error("Error loading LGAs:", err);
        setKnownLgas([]);
      }
    }

    loadLgas();
  }, []);

  const placeholder = useMemo(
    () => (knownLgas.length ? `Try: ${knownLgas.slice(0, 3).map(l => l.lga).join(", ")}` : "e.g. Lokoja"),
    [knownLgas],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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

      setResult(payload as AlertResponse);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm border border-green-200">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Flood Risk</h2>
        <p className="text-gray-600">Select your Local Government Area to get personalized flood alerts</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="lga" className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Local Government Area (LGA)
          </label>
          <div className="relative">
            <input
              id="lga"
              value={lga}
              onChange={(event) => setLga(event.target.value)}
              list="lga-options"
              placeholder={placeholder}
              className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-4 text-gray-900 outline-none ring-0 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200 text-lg"
            />
            <datalist id="lga-options">
              {knownLgas.map((entry, idx) => (
                <option
                  key={entry?.lga && entry?.state ? `${entry.lga}_${entry.state}` : `lga-${idx}`}
                  value={entry?.lga ?? ""}
                />
              ))}
            </datalist>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-600 to-orange-600 px-8 py-4 font-semibold text-white shadow-lg hover:from-green-700 hover:to-orange-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 text-lg"
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Analyzing Risk...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Get Flood Alert
              </>
            )}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
                result.record.risk_level === 'high' ? 'bg-red-100 text-red-600' :
                result.record.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                {result.record.risk_level === 'high' ? '⚠️' :
                 result.record.risk_level === 'medium' ? '⚡' : '✅'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {result.record.risk_level.toUpperCase()} Flood Risk
                </h3>
                <p className="text-sm text-gray-600">
                  {result.record.lga}, {result.record.state} • {result.record.timeframe}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Alert Messages
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["en", "ha", "yo", "ig"] as LanguageCode[]).map((code) => {
                const message = result.alerts[code];
                return (
                  <div key={code} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {languageLabels[code]}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(message)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {message}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}