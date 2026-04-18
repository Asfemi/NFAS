"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type RegionalLanguageCode = "ha" | "yo" | "ig";

interface LgaDirectoryEntry {
  lga: string;
  state: string;
  localLanguage: RegionalLanguageCode;
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
}

const regionalLabels: Record<RegionalLanguageCode, string> = {
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

export function AlertForm() {
  const [lga, setLga] = useState("");
  const [directory, setDirectory] = useState<LgaDirectoryEntry[]>([]);
  const [result, setResult] = useState<AlertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLgas() {
      const response = await fetch("/api/lgas");
      const payload = (await response.json()) as {
        items?: LgaDirectoryEntry[];
        lgas?: string[];
      };
      setDirectory(payload.items ?? []);
    }

    loadLgas().catch(() => {
      setDirectory([]);
    });
  }, []);

  const knownLgas = useMemo(
    () => directory.map((entry) => entry.lga).sort((a, b) => a.localeCompare(b)),
    [directory],
  );

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

  const placeholder = useMemo(
    () =>
      knownLgas.length ? `Try: ${knownLgas.slice(0, 3).join(", ")}` : "e.g. Lokoja",
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
        {autoLanguage ? (
          <p className="text-sm text-zinc-600">
            Local SMS language for this area:{" "}
            <span className="font-semibold text-zinc-800">
              {regionalLabels[autoLanguage]}
            </span>{" "}
            (with English).
          </p>
        ) : null}
      </form>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-zinc-100 p-3 text-sm text-zinc-700">
            <span className="font-semibold">Risk:</span> {result.record.risk_level.toUpperCase()} in{" "}
            {result.record.lga}, {result.record.state} ({result.record.timeframe})
            <span className="mt-1 block text-zinc-600">
              Alerts: English + {regionalLabels[result.localLanguage]} only.
            </span>
          </div>
          <article className="rounded-xl border border-zinc-200 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <h3 className="font-semibold text-zinc-800">English</h3>
              <span className="text-zinc-500">{result.alerts.en.length}/160</span>
            </div>
            <p className="text-zinc-700">{result.alerts.en}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <h3 className="font-semibold text-zinc-800">
                {regionalLabels[result.localLanguage]}
              </h3>
              <span className="text-zinc-500">{result.alerts.local.length}/160</span>
            </div>
            <p className="text-zinc-700">{result.alerts.local}</p>
          </article>
        </div>
      ) : null}
    </div>
  );
}
