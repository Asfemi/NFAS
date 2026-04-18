"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";

type RegionalLanguageCode = "ha" | "yo" | "ig";

export interface PersonalizedAlertPayload {
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
  personalized?: boolean;
}

const regionalLabels: Record<RegionalLanguageCode, string> = {
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

interface PersonalizedAlertsModalProps {
  open: boolean;
  lga: string;
  onClose: () => void;
}

export function PersonalizedAlertsModal({
  open,
  lga,
  onClose,
}: PersonalizedAlertsModalProps) {
  const titleId = useId();
  const phoneRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState("");
  const [farmInfo, setFarmInfo] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PersonalizedAlertPayload | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const id = requestAnimationFrame(() => {
      phoneRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!phone.trim()) {
      setError("Enter your phone number so alerts can be tailored for SMS delivery.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lga,
          phone: phone.trim(),
          ...(farmInfo.trim() ? { farmInfo: farmInfo.trim() } : {}),
          ...(extraInfo.trim() ? { extraInfo: extraInfo.trim() } : {}),
        }),
      });

      const payload = (await response.json()) as
        | PersonalizedAlertPayload
        | { error?: string };

      if (!response.ok) {
        const message =
          "error" in payload ? payload.error : "Could not generate tailored alerts.";
        setError(message ?? "Could not generate tailored alerts.");
        return;
      }

      setResult(payload as PersonalizedAlertPayload);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
              Get tailored flood alerts
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              For <span className="font-medium text-zinc-800">{lga}</span>. Add optional
              farm or community details so the advisory matches your situation. This MVP
              does not store your number; it is only used for this request.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pa-phone" className="block text-sm font-medium text-zinc-800">
              Phone number <span className="text-red-600">*</span>
            </label>
            <input
              ref={phoneRef}
              id="pa-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. 08031234567 or +2348031234567"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none focus:border-zinc-500"
              required
            />
          </div>
          <div>
            <label htmlFor="pa-farm" className="block text-sm font-medium text-zinc-800">
              Farm or operation (optional)
            </label>
            <textarea
              id="pa-farm"
              value={farmInfo}
              onChange={(event) => setFarmInfo(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. 2 ha rice near the river; poultry pens; cassava store by the road…"
              className="mt-1 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="pa-extra" className="block text-sm font-medium text-zinc-800">
              Community or extra detail (optional)
            </label>
            <textarea
              id="pa-extra"
              value={extraInfo}
              onChange={(event) => setExtraInfo(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. village access floods first; school used as shelter; low bridge…"
              className="mt-1 w-full resize-y rounded-xl border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:bg-zinc-500"
            >
              {loading ? "Generating…" : "Generate tailored alerts"}
            </button>
          </div>
        </form>

        {result ? (
          <div className="mt-6 space-y-3 border-t border-zinc-200 pt-6">
            <p className="text-sm font-medium text-zinc-800">
              Your tailored messages ({regionalLabels[result.localLanguage]} + English)
            </p>
            <article className="rounded-xl border border-zinc-200 p-3">
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span className="font-semibold text-zinc-700">English</span>
                <span>{result.alerts.en.length}/160</span>
              </div>
              <p className="text-sm text-zinc-800">{result.alerts.en}</p>
            </article>
            <article className="rounded-xl border border-zinc-200 p-3">
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span className="font-semibold text-zinc-700">
                  {regionalLabels[result.localLanguage]}
                </span>
                <span>{result.alerts.local.length}/160</span>
              </div>
              <p className="text-sm text-zinc-800">{result.alerts.local}</p>
            </article>
          </div>
        ) : null}
      </div>
    </div>
  );
}
