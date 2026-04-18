import SmsGatewayClient, {
  type HttpClient,
  type MessageState,
  ProcessState,
} from "android-sms-gateway";
import type { BilingualAlerts } from "@/backend/types";
import type { SmsGatewayDeliveryResult } from "@/backend/types";
import { normalizePhoneToE164 } from "@/backend/phone";

function createFetchHttpClient(): HttpClient {
  async function parseBody<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON from SMS Gateway (${response.status}).`);
    }
  }

  return {
    async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
      const response = await fetch(url, { headers, cache: "no-store" });
      if (!response.ok) {
        throw new Error(`SMS Gateway GET ${response.status}`);
      }
      return parseBody<T>(response);
    },
    async post<T>(
      url: string,
      body: unknown,
      headers?: Record<string, string>,
    ): Promise<T> {
      const response = await fetch(url, {
        method: "POST",
        headers: { ...headers },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!response.ok) {
        const errText = (await response.text()).slice(0, 400);
        throw new Error(errText || `SMS Gateway POST ${response.status}`);
      }
      return parseBody<T>(response);
    },
    async put<T>(): Promise<T> {
      throw new Error("SMS Gateway client: PUT not used");
    },
    async patch<T>(): Promise<T> {
      throw new Error("SMS Gateway client: PATCH not used");
    },
    async delete<T>(): Promise<T> {
      throw new Error("SMS Gateway client: DELETE not used");
    },
  };
}

function mapSendOutcome(
  state: MessageState | undefined,
  sendError: unknown,
): "sent" | "failed" {
  if (sendError || !state) {
    return "failed";
  }
  if (state.state === ProcessState.Failed) {
    return "failed";
  }
  const recipient = state.recipients[0];
  if (!recipient || recipient.state === ProcessState.Failed) {
    return "failed";
  }
  return "sent";
}

function pushError(errors: string[], label: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  errors.push(`${label}: ${message}`);
}

/**
 * Sends bilingual flood alerts via [SMSGate](https://sms-gate.app/) (Android SMS Gateway cloud API).
 * Credentials: `SMSGATE_USERNAME` / `SMSGATE_PASSWORD`, or `ASG_USERNAME` / `ASG_PASSWORD`.
 */
export async function sendBilingualAlertsViaSmsgate(
  phoneRaw: string,
  alerts: BilingualAlerts,
): Promise<SmsGatewayDeliveryResult> {
  const username =
    process.env.SMSGATE_USERNAME?.trim() || process.env.ASG_USERNAME?.trim();
  const password =
    process.env.SMSGATE_PASSWORD?.trim() || process.env.ASG_PASSWORD?.trim();

  const phoneE164 = normalizePhoneToE164(phoneRaw);
  if (!phoneE164) {
    return {
      attempted: false,
      skippedReason: "invalid_phone",
      english: "skipped",
      local: "skipped",
      errors: ["Could not normalize phone number for SMS."],
    };
  }

  if (!username || !password) {
    return {
      attempted: false,
      skippedReason: "not_configured",
      phoneE164,
      english: "skipped",
      local: "skipped",
      errors: [],
    };
  }

  const client = new SmsGatewayClient(
    username,
    password,
    createFetchHttpClient(),
  );

  const errors: string[] = [];
  let englishState: MessageState | undefined;
  let localState: MessageState | undefined;
  let englishErr: unknown;
  let localErr: unknown;

  try {
    englishState = await client.send({
      message: alerts.en,
      phoneNumbers: [phoneE164],
    });
  } catch (e) {
    englishErr = e;
    pushError(errors, "English SMS", e);
  }

  try {
    localState = await client.send({
      message: alerts.local,
      phoneNumbers: [phoneE164],
    });
  } catch (e) {
    localErr = e;
    pushError(errors, "Local-language SMS", e);
  }

  const english = mapSendOutcome(englishState, englishErr);
  const local = mapSendOutcome(localState, localErr);

  if (english === "failed" && englishState?.recipients[0]?.error) {
    errors.push(`English SMS: ${englishState.recipients[0].error}`);
  }
  if (local === "failed" && localState?.recipients[0]?.error) {
    errors.push(`Local-language SMS: ${localState.recipients[0].error}`);
  }

  const messageIds = [englishState?.id, localState?.id].filter(
    (id): id is string => Boolean(id),
  );

  return {
    attempted: true,
    phoneE164,
    english,
    local,
    errors,
    ...(messageIds.length ? { messageIds } : {}),
  };
}
