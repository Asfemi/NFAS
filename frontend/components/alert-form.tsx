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
    <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="lga" className="block text-sm font-semibold text-zinc-800">
          Local Government Area (LGA)
        </label>
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
            {knownLgas.map((entry, idx) => (
              <option 
                key={entry?.lga && entry?.state ? `${entry.lga}_${entry.state}` : `lga-${idx}`}
                value={entry?.lga ?? ""}
              />
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
      </form>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-zinc-100 p-3 text-sm text-zinc-700">
            <span className="font-semibold">Risk:</span> {result.record.risk_level.toUpperCase()} in{" "}
            {result.record.lga}, {result.record.state} ({result.record.timeframe})
          </div>
          {(["en", "ha", "yo", "ig"] as LanguageCode[]).map((code) => {
            const message = result.alerts[code];
            return (
              <article key={code} className="rounded-xl border border-zinc-200 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <h3 className="font-semibold text-zinc-800">{languageLabels[code]}</h3>
                  <span className="text-zinc-500">{message.length}/160</span>
                </div>
                <p className="text-zinc-700">{message}</p>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
