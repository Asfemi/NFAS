"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SmsGatewayDeliveryResult } from "@/backend/types";
import { AnimatedDialog } from "@/frontend/components/animated-dialog";

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
  outlook?: {
    en: string;
    local: string;
  };
  personalized?: boolean;
  smsDelivery?: SmsGatewayDeliveryResult;
}

const regionalLabels: Record<RegionalLanguageCode, string> = {
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

const resultBlock = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const resultItem = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

function SmsDeliveryNotice({ sms }: { sms: SmsGatewayDeliveryResult }) {
  if (sms.skippedReason === "not_configured") {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        SMS was not sent: set{" "}
        <code className="rounded bg-amber-100/80 px-1 text-xs">SMSGATE_USERNAME</code> and{" "}
        <code className="rounded bg-amber-100/80 px-1 text-xs">SMSGATE_PASSWORD</code> on the
        server (credentials from the{" "}
        <a
          href="https://sms-gate.app/"
          className="underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          SMSGate
        </a>{" "}
        app). Messages below are ready to copy.
      </p>
    );
  }

  if (sms.skippedReason === "invalid_phone") {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        SMS was not sent: {sms.errors[0] ?? "Invalid phone for E.164."}
      </p>
    );
  }

  const bothOk = sms.english === "sent" && sms.local === "sent";
  if (bothOk) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        Both SMS messages were submitted to SMSGate for{" "}
        <span className="font-medium">{sms.phoneE164}</span>.
        {sms.messageIds && sms.messageIds.length > 0 ? (
          <span className="mt-1 block font-mono text-[11px] text-emerald-800/90">
            Message IDs: {sms.messageIds.join(", ")}
          </span>
        ) : null}
      </p>
    );
  }

  return (
    <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <p className="font-medium">SMS delivery incomplete</p>
      <p className="mt-1 text-amber-900">
        English: {sms.english === "sent" ? "submitted" : "failed"} · Local:{" "}
        {sms.local === "sent" ? "submitted" : "failed"}
        {sms.phoneE164 ? ` · ${sms.phoneE164}` : ""}
      </p>
      {sms.errors.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-xs text-amber-900">
          {sms.errors.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

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
  const reduce = useReducedMotion();
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

  return (
    <AnimatedDialog open={open} onClose={onClose} labelledBy={titleId} maxWidthClassName="max-w-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-1">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 sm:text-lg">
            Get tailored flood alerts
          </h2>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-zinc-600">
            For <span className="font-medium text-zinc-800">{lga}</span>. Add optional farm or
            community details so the advisory matches your situation. Your number is used on this
            request to generate tailored text and is not stored.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 min-w-10 shrink-0 rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
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
            className="mt-1 min-h-11 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-zinc-500 sm:min-h-0 sm:text-sm"
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

        <AnimatePresence initial={false}>
          {loading ? (
            <motion.div
              key="pa-loading"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-wrap items-center gap-2 text-sm text-zinc-600"
            >
              <span className="inline-flex items-center gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="inline-block h-2 w-2 rounded-full bg-zinc-500"
                    animate={
                      reduce
                        ? {}
                        : { y: [0, -7, 0], opacity: [0.45, 1, 0.45] }
                    }
                    transition={{
                      repeat: reduce ? 0 : Infinity,
                      duration: 0.55,
                      delay: i * 0.14,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </span>
              <span>Building your tailored advisory…</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {error ? (
            <motion.p
              key={error}
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.12 : 0.22 }}
              className="overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 sm:min-h-0 sm:w-auto"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={loading}
            className="min-h-11 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:bg-zinc-500 sm:min-h-0 sm:w-auto"
            animate={
              loading && !reduce
                ? { scale: [1, 1.03, 1] }
                : { scale: 1 }
            }
            transition={
              loading && !reduce
                ? { repeat: Infinity, duration: 1.1, ease: "easeInOut" }
                : {}
            }
          >
            {loading ? "Generating…" : "Generate tailored alerts"}
          </motion.button>
        </div>
      </form>

      <AnimatePresence>
        {result ? (
          <motion.div
            key="pa-results"
            className="mt-6 space-y-3 border-t border-zinc-200 pt-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", damping: 17, stiffness: 280 }}
          >
            <motion.div variants={resultBlock} initial="hidden" animate="show">
              {result.smsDelivery ? (
                <motion.div variants={resultItem}>
                  <SmsDeliveryNotice sms={result.smsDelivery} />
                </motion.div>
              ) : null}
              <motion.p variants={resultItem} className="text-sm font-medium text-zinc-800">
                Your tailored messages ({regionalLabels[result.localLanguage]} + English)
              </motion.p>
              <motion.article
                variants={resultItem}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="mb-1 flex justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700">English</span>
                  <span>{result.alerts.en.length}/160</span>
                </div>
                <p className="text-sm text-zinc-800">{result.alerts.en}</p>
              </motion.article>
              <motion.article
                variants={resultItem}
                className="rounded-xl border border-zinc-200 p-3"
              >
                <div className="mb-1 flex justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700">
                    {regionalLabels[result.localLanguage]}
                  </span>
                  <span>{result.alerts.local.length}/160</span>
                </div>
                <p className="text-sm text-zinc-800">{result.alerts.local}</p>
              </motion.article>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AnimatedDialog>
  );
}
