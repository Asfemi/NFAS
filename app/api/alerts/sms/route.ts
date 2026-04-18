import { buildFloodAlertResponse } from "@/backend/alerts";
import { isFloodForecastUnavailableError } from "@/backend/forecast-error";
import { isGeminiAdvisoryError } from "@/backend/gemini-error";
import { isNigeriaGeoDatasetError } from "@/backend/nigeria-geo";
import { normalizePhoneNumber, validateNigerianPhoneNumber } from "@/backend/sms";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptionByPhone,
  getSubscriptionsForLga,
} from "@/backend/sms-db";
import { sendSmsTextViaSmsgate } from "@/backend/smsgate";
import type { BilingualAlerts, LanguageCode, SMSAlertRequest } from "@/backend/types";

function smsCopyForLanguage(alerts: BilingualAlerts, lang: LanguageCode): string {
  return lang === "en" ? alerts.en : alerts.local;
}

interface SMSRequestBody extends SMSAlertRequest {
  action?: "subscribe" | "unsubscribe" | "send";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as SMSRequestBody | null;
    const action = body?.action || "subscribe";
    const phoneNumber = body?.phoneNumber?.trim();
    const lga = body?.lga?.trim();
    const preferredLanguage = (body?.preferredLanguage || "en") as LanguageCode;

    if (!phoneNumber) {
      return Response.json(
        { error: "Please provide a valid phone number." },
        { status: 400 },
      );
    }

    if (!validateNigerianPhoneNumber(phoneNumber)) {
      return Response.json(
        {
          error:
            "Invalid Nigerian phone number. Please use format 0XXXXXXXXXX or +234XXXXXXXXXX",
        },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const subscriptionKey = normalizedPhone;

    if (action === "subscribe") {
      if (!lga) {
        return Response.json(
          { error: "Please provide an LGA for the alert subscription." },
          { status: 400 },
        );
      }

      const alertData = await buildFloodAlertResponse(lga);
      if (!alertData) {
        return Response.json({ error: "LGA not found in the dataset." }, { status: 404 });
      }

      const subscription = await createSubscription(
        normalizedPhone,
        alertData.record.lga,
        alertData.record.state,
        preferredLanguage,
      );

      const smsMessage = smsCopyForLanguage(alertData.alerts, preferredLanguage);
      const truncatedMessage =
        smsMessage.length > 160 ? `${smsMessage.slice(0, 157)}...` : smsMessage;

      const welcomeMsg = `Welcome to Flood Sentinel Nigeria! You will receive flood alerts for ${alertData.record.lga}, ${alertData.record.state}.`;
      const welcomeSend = await sendSmsTextViaSmsgate(normalizedPhone, welcomeMsg);

      return Response.json({
        success: true,
        message: `SMS alert subscription created for ${normalizedPhone}`,
        subscription,
        smsPreview: truncatedMessage,
        welcomeMessageSent: welcomeSend.status === "sent",
        welcomeSend,
      });
    }

    if (action === "unsubscribe") {
      const deleted = await deleteSubscription(subscriptionKey);
      if (deleted) {
        return Response.json({
          success: true,
          message: `Unsubscribed ${normalizedPhone} from SMS alerts`,
        });
      }

      return Response.json(
        { error: "Phone number not found in subscriptions." },
        { status: 404 },
      );
    }

    if (action === "send") {
      if (!lga) {
        return Response.json(
          { error: "Please provide an LGA to send alert for." },
          { status: 400 },
        );
      }

      const alertData = await buildFloodAlertResponse(lga);
      if (!alertData) {
        return Response.json({ error: "LGA not found in the dataset." }, { status: 404 });
      }

      const subscribers = await getSubscriptionsForLga(lga);

      if (subscribers.length === 0) {
        return Response.json({
          success: true,
          message: "No active SMS subscribers for this LGA",
          sent: 0,
        });
      }

      const results: {
        phoneNumber: string;
        language: LanguageCode;
        message: string;
        status: string;
        messageId?: string;
        gateway?: Awaited<ReturnType<typeof sendSmsTextViaSmsgate>>;
      }[] = [];

      for (const sub of subscribers) {
        const message = smsCopyForLanguage(alertData.alerts, sub.preferredLanguage);
        const smsMessage =
          message.length > 160 ? `${message.slice(0, 157)}...` : message;

        const gateway = await sendSmsTextViaSmsgate(sub.phoneNumber, smsMessage);
        const status =
          gateway.status === "sent"
            ? "sent"
            : gateway.status === "skipped"
              ? "skipped"
              : "failed";

        results.push({
          phoneNumber: sub.phoneNumber,
          language: sub.preferredLanguage,
          message: smsMessage,
          status,
          ...(gateway.messageId ? { messageId: gateway.messageId } : {}),
          gateway,
        });
      }

      const sentCount = results.filter((r) => r.status === "sent").length;
      const failedCount = results.filter((r) => r.status === "failed").length;
      const skippedCount = results.filter((r) => r.status === "skipped").length;

      return Response.json({
        success: true,
        message: `SMS: ${sentCount} sent${failedCount > 0 ? `, ${failedCount} failed` : ""}${skippedCount > 0 ? `, ${skippedCount} skipped (SMSGate not configured or invalid phone)` : ""}`,
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount,
        total: results.length,
        alerts: results,
      });
    }

    return Response.json(
      { error: "Invalid action. Use 'subscribe', 'unsubscribe', or 'send'." },
      { status: 400 },
    );
  } catch (error) {
    if (isGeminiAdvisoryError(error)) {
      return Response.json({ error: error.message }, { status: error.httpStatus });
    }
    if (isFloodForecastUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    if (isNigeriaGeoDatasetError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("SMS API error:", error);
    return Response.json({ error: "Failed to process SMS request" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get("phone");

  if (!phoneNumber) {
    return Response.json(
      { error: "Please provide a phone number to query." },
      { status: 400 },
    );
  }

  if (!validateNigerianPhoneNumber(phoneNumber)) {
    return Response.json({ error: "Invalid Nigerian phone number." }, { status: 400 });
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const subscription = await getSubscriptionByPhone(normalizedPhone);

  if (!subscription) {
    return Response.json(
      { message: "No active subscription found for this phone number" },
      { status: 404 },
    );
  }

  return Response.json({
    subscription,
  });
}
