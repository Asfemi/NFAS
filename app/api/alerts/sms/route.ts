import { buildFloodAlertResponse } from "@/backend/alerts";
import { normalizePhoneNumber, validateNigerianPhoneNumber } from "@/backend/sms";
import {
  createSubscription,
  deleteSubscription,
  getSubscriptionByPhone,
  getSubscriptionsForLga,
} from "@/backend/sms-db";
import { LanguageCode, SMSAlertRequest } from "@/backend/types";
import twilio from "twilio";

// Initialize Twilio client
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!twilioAccountSid || !twilioAuthToken) {
  console.warn("Twilio credentials not configured. SMS features will be disabled.");
}

let twilioClient: ReturnType<typeof twilio> | null = null;

try {
  if (twilioAccountSid && twilioAuthToken) {
    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  }
} catch (error) {
  console.warn("Failed to initialize Twilio client:", error);
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
    const preferredLanguage = body?.preferredLanguage || "en";

    if (!phoneNumber) {
      return Response.json(
        { error: "Please provide a valid phone number." },
        { status: 400 },
      );
    }

    if (!validateNigerianPhoneNumber(phoneNumber)) {
      return Response.json(
        { error: "Invalid Nigerian phone number. Please use format 0XXXXXXXXXX or +234XXXXXXXXXX" },
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
        return Response.json(
          { error: "LGA not found in the dataset." },
          { status: 404 },
        );
      }

      // Create subscription in database
      const subscription = await createSubscription(
        normalizedPhone,
        alertData.record.lga,
        alertData.record.state,
        preferredLanguage as LanguageCode,
      );

      // Prepare SMS alert message (truncated for SMS)
      const smsMessage = alertData.alerts[preferredLanguage];
      const truncatedMessage = smsMessage.length > 160 
        ? smsMessage.substring(0, 157) + "..." 
        : smsMessage;

      // Send welcome SMS via Twilio
      let messageId: string | undefined;
      if (twilioClient && twilioPhoneNumber) {
        try {
          const welcomeMsg = `Welcome to Flood Sentinel Nigeria! You will receive flood alerts for ${alertData.record.lga}, ${alertData.record.state}.`;
          const result = await twilioClient.messages.create({
            body: welcomeMsg,
            from: twilioPhoneNumber,
            to: normalizedPhone,
          });
          messageId = result.sid;
          console.log(`[SMS] Welcome message sent to ${normalizedPhone} (${result.sid})`);
        } catch (error) {
          console.error(`[SMS] Failed to send welcome SMS to ${normalizedPhone}:`, error);
        }
      }

      return Response.json({
        success: true,
        message: `SMS alert subscription created for ${normalizedPhone}`,
        subscription,
        smsPreview: truncatedMessage,
        welcomeMessageSent: !!messageId,
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
        return Response.json(
          { error: "LGA not found in the dataset." },
          { status: 404 },
        );
      }

      // Get subscribers for this LGA from database
      const subscribers = await getSubscriptionsForLga(lga);

      if (subscribers.length === 0) {
        return Response.json({
          success: true,
          message: "No active SMS subscribers for this LGA",
          sent: 0,
        });
      }

      // Send SMS via Twilio for each subscriber
      const sendPromises: Promise<{ phoneNumber: string; language: LanguageCode; message: string; status: string; messageId?: string }>[] = [];

      for (const sub of subscribers) {
        const message = alertData.alerts[sub.preferredLanguage];
        
        // Truncate message to 160 characters for SMS
        const smsMessage = message.length > 160 
          ? message.substring(0, 157) + "..." 
          : message;

        if (twilioClient && twilioPhoneNumber) {
          // Send via Twilio
          sendPromises.push(
            (async () => {
              try {
                const result = await twilioClient.messages.create({
                  body: smsMessage,
                  from: twilioPhoneNumber,
                  to: sub.phoneNumber,
                });
                return {
                  phoneNumber: sub.phoneNumber,
                  language: sub.preferredLanguage,
                  message: smsMessage,
                  status: "sent",
                  messageId: result.sid,
                };
              } catch (error) {
                console.error(`Failed to send SMS to ${sub.phoneNumber}:`, error);
                return {
                  phoneNumber: sub.phoneNumber,
                  language: sub.preferredLanguage,
                  message: smsMessage,
                  status: "failed",
                };
              }
            })()
          );
        } else {
          // Fallback: just log if Twilio not configured
          console.log(`[SMS] ${sub.phoneNumber} (${sub.preferredLanguage}): ${smsMessage}`);
          sendPromises.push(
            Promise.resolve({
              phoneNumber: sub.phoneNumber,
              language: sub.preferredLanguage,
              message: smsMessage,
              status: "logged",
            })
          );
        }
      }

      const results = await Promise.all(sendPromises);
      const sentCount = results.filter(r => r.status === "sent").length;
      const failedCount = results.filter(r => r.status === "failed").length;

      return Response.json({
        success: true,
        message: `SMS alerts sent to ${sentCount} subscribers${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
        sent: sentCount,
        failed: failedCount,
        total: results.length,
        alerts: results,
      });
    }

    return Response.json(
      { error: "Invalid action. Use 'subscribe', 'unsubscribe', or 'send'." },
      { status: 400 },
    );
  } catch (error) {
    console.error("SMS API error:", error);
    return Response.json(
      { error: "Failed to process SMS request" },
      { status: 500 },
    );
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
    return Response.json(
      { error: "Invalid Nigerian phone number." },
      { status: 400 },
    );
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
