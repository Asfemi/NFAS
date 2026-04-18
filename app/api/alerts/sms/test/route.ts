import { validateNigerianPhoneNumber } from "@/backend/sms";
import { sendSmsTextViaSmsgate } from "@/backend/smsgate";

function smsgateConfigured(): boolean {
  const user =
    process.env.SMSGATE_USERNAME?.trim() || process.env.ASG_USERNAME?.trim();
  const pass =
    process.env.SMSGATE_PASSWORD?.trim() || process.env.ASG_PASSWORD?.trim();
  return Boolean(user && pass);
}

export async function POST(request: Request) {
  if (!smsgateConfigured()) {
    return Response.json(
      {
        error:
          "SMSGate not configured. Set SMSGATE_USERNAME and SMSGATE_PASSWORD (or ASG_USERNAME / ASG_PASSWORD).",
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
      return Response.json({ error: "Please provide a 'to' phone number" }, { status: 400 });
    }

    if (!validateNigerianPhoneNumber(toNumber)) {
      return Response.json(
        { error: "Invalid Nigerian phone number (use 0… or +234…)." },
        { status: 400 },
      );
    }

    if (!message) {
      return Response.json({ error: "Please provide a 'message'" }, { status: 400 });
    }

    const result = await sendSmsTextViaSmsgate(toNumber, message);

    if (result.status === "sent") {
      return Response.json({
        success: true,
        messageId: result.messageId,
        status: result.status,
        message: `SMS submitted via SMSGate to ${toNumber}`,
        gateway: result,
      });
    }

    return Response.json(
      {
        error: "SMSGate did not accept the message",
        gateway: result,
      },
      { status: result.skippedReason === "invalid_phone" ? 400 : 502 },
    );
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
  const configured = smsgateConfigured();

  if (!configured) {
    return Response.json({
      configured: false,
      message:
        "SMSGate is not configured. Set SMSGATE_USERNAME and SMSGATE_PASSWORD in the server environment.",
      instructions: {
        username: "SMSGATE_USERNAME or ASG_USERNAME",
        password: "SMSGATE_PASSWORD or ASG_PASSWORD",
      },
    });
  }

  return Response.json({
    configured: true,
    message: "SMSGate credentials are set (Android SMS Gateway cloud API).",
    usage: {
      method: "POST",
      url: "/api/alerts/sms/test",
      body: {
        to: "+234XXXXXXXXXX or 0XXXXXXXXXX",
        message: "Your test SMS message",
      },
    },
  });
}
