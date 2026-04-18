import twilio from "twilio";

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: Request) {
  // Check if Twilio is configured
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return Response.json(
      {
        error: "Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env.local",
        configured: false,
      },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      to?: string;
      message?: string;
    } | null;

    const toNumber = body?.to?.trim();
    const message = body?.message?.trim();

    if (!toNumber) {
      return Response.json(
        { error: "Please provide a 'to' phone number" },
        { status: 400 },
      );
    }

    if (!message) {
      return Response.json(
        { error: "Please provide a 'message'" },
        { status: 400 },
      );
    }

    const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: toNumber,
    });

    return Response.json({
      success: true,
      messageId: result.sid,
      status: result.status,
      from: result.from,
      to: result.to,
      message: `SMS sent successfully to ${toNumber}`,
    });
  } catch (error) {
    console.error("SMS test error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: "Failed to send test SMS",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return Response.json({
      configured: false,
      message: "Twilio is not configured. Please update .env.local with your credentials.",
      instructions: {
        accountSid: "Missing TWILIO_ACCOUNT_SID",
        authToken: "Missing TWILIO_AUTH_TOKEN",
        phoneNumber: "Missing TWILIO_PHONE_NUMBER",
      },
    });
  }

  return Response.json({
    configured: true,
    message: "Twilio is properly configured",
    twilioPhoneNumber,
    usage: {
      method: "POST",
      url: "/api/alerts/sms/test",
      body: {
        to: "+234XXXXXXXXXX (recipient phone number)",
        message: "Your test SMS message",
      },
    },
  });
}
