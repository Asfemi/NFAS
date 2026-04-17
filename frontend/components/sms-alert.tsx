"use client";

import { FormEvent, useState } from "react";

type LanguageCode = "en" | "ha" | "yo" | "ig";

interface SMSAlertComponentProps {
  lga: string;
  state: string;
}

const languageLabels: Record<LanguageCode, string> = {
  en: "English",
  ha: "Hausa",
  yo: "Yoruba",
  ig: "Igbo",
};

export function SMSAlertComponent({ lga, state }: SMSAlertComponentProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>("en");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [smsPreview, setSmsPreview] = useState<string | null>(null);

  async function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/alerts/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          phoneNumber,
          lga,
          preferredLanguage,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
        smsPreview?: string;
      };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to subscribe to SMS alerts",
        });
        return;
      }

      setSmsPreview(data.smsPreview || null);
      setMessage({
        type: "success",
        text: data.message || "Successfully subscribed to SMS alerts!",
      });
      setPhoneNumber("");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowForm(false);
      }, 3000);
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        Subscribe to SMS Alerts
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 p-6 w-full max-w-md shadow-lg">
      <div className="flex items-start justify-between mb-5">
        <h3 className="font-bold text-lg text-gray-900">
          Get SMS Alerts
        </h3>
        <button
          onClick={() => {
            setShowForm(false);
            setMessage(null);
          }}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      <p className="text-sm text-gray-700 mb-6 leading-relaxed">
        <span className="font-semibold text-gray-900">{lga}, {state}</span> alerts will be sent to your phone in your preferred language.
      </p>

      <form onSubmit={handleSubscribe} className="space-y-5">
        {/* Phone Number Input */}
        <div>
          <label htmlFor="phone" className="block text-sm font-bold text-gray-800 mb-3">
            Your Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="0801234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border-2 border-blue-300 bg-white px-4 py-4 text-base font-semibold text-gray-900 placeholder:text-gray-500 outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-300/30 disabled:bg-gray-100 transition-all duration-200"
          />
          <p className="text-xs text-gray-600 mt-2">Format: 0801234567 or +234801234567</p>
        </div>

        {/* Language Selector */}
        <div>
          <label htmlFor="language" className="block text-sm font-bold text-gray-800 mb-3">
            Preferred Language
          </label>
          <div className="relative">
            <select
              id="language"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
              disabled={loading}
              className="w-full rounded-lg border-2 border-blue-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none appearance-none cursor-pointer focus:border-blue-600 focus:ring-3 focus:ring-blue-300/30 disabled:bg-gray-100 transition-all duration-200 pr-10"
            >
              {(["en", "ha", "yo", "ig"] as LanguageCode[]).map((code) => (
                <option key={code} value={code} className="py-2">
                  {languageLabels[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          type="submit"
          disabled={loading || !phoneNumber}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-bold text-white hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
        >
          {loading ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Subscribing...
            </>
          ) : (
            "Subscribe Now"
          )}
        </button>
      </form>

      {/* Messages */}
      {message ? (
        <div className={`mt-5 rounded-lg p-4 border-2 ${
          message.type === "success"
            ? "bg-green-100 border-green-300"
            : "bg-red-100 border-red-300"
        }`}>
          <p className={`text-sm font-semibold ${
            message.type === "success" ? "text-green-800" : "text-red-800"
          }`}>
            {message.text}
          </p>
        </div>
      ) : null}

      {/* SMS Preview */}
      {smsPreview ? (
        <div className="mt-5 rounded-lg bg-white border-2 border-blue-200 p-4">
          <p className="text-xs font-bold text-blue-700 mb-2">Alert Preview:</p>
          <p className="text-sm text-gray-800 leading-relaxed">{smsPreview}</p>
        </div>
      ) : null}
    </div>
  );
}
