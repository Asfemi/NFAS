import SmsGatewayClient, {
  type HttpClient,
  type Message,
  type MessageState,
  type RecipientState,
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

/** Delivery reports default off — SMSGate docs link them to send failures / limits on some devices. Set `SMSGATE_WITH_DELIVERY_REPORT=1` to enable. */
function gatewayWantsDeliveryReport(): boolean {
  const v = process.env.SMSGATE_WITH_DELIVERY_REPORT?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** SIM index (often 0 or 1) when dual-SIM default is wrong or set to “ask every time”. See https://docs.sms-gate.app/faq/errors/ */
function gatewaySimNumber(): number | undefined {
  const raw = process.env.SMSGATE_SIM_NUMBER?.trim();
  if (!raw) {
    return undefined;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 && n <= 3 ? n : undefined;
}

function gatewayMessagePayload(message: string, phoneNumbers: string[]): Message {
  const simNumber = gatewaySimNumber();
  return {
    message,
    phoneNumbers,
    withDeliveryReport: gatewayWantsDeliveryReport(),
    ...(simNumber !== undefined ? { simNumber } : {}),
  };
}

const GATEWAY_POLL_INTERVAL_MS = 1_800;
const GATEWAY_POLL_MAX_MS = 45_000;

function recipientNeedsPoll(recipient: RecipientState | undefined): boolean {
  return Boolean(recipient && recipient.state === ProcessState.Pending);
}

function messageNeedsPoll(state: MessageState): boolean {
  if (state.state === ProcessState.Pending) {
    return true;
  }
  return recipientNeedsPoll(state.recipients[0]);
}

async function resolveMessageState(
  client: SmsGatewayClient,
  initial: MessageState,
): Promise<MessageState> {
  let state = initial;
  const deadline = Date.now() + GATEWAY_POLL_MAX_MS;
  while (Date.now() < deadline && messageNeedsPoll(state)) {
    await new Promise((resolve) => setTimeout(resolve, GATEWAY_POLL_INTERVAL_MS));
    state = await client.getState(state.id);
  }
  return state;
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
  if (state.state === ProcessState.Pending) {
    return "failed";
  }
  const recipient = state.recipients[0];
  if (!recipient || recipient.state === ProcessState.Failed) {
    return "failed";
  }
  if (recipient.state === ProcessState.Pending) {
    return "failed";
  }
  return "sent";
}

function appendGenericFailureHints(errors: string[]): void {
  const blob = errors.join(" ").toUpperCase();
  if (!blob.includes("GENERIC_FAILURE")) {
    return;
  }
  errors.push(
    "SMSGate / Android: RESULT_ERROR_GENERIC_FAILURE usually means the phone could not send on the cellular stack (SIM, carrier, balance, signal, or dual-SIM routing). Try: set a fixed default SMS SIM (not “Ask every time”), set SMSGATE_SIM_NUMBER=0 or 1 (or 2) to match the SIM that has SMS, confirm SMS permission + airtime/SMS plan, send a test SMS from the stock Messages app on that device, then see https://docs.sms-gate.app/faq/errors/",
  );
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
    const initial = await client.send(
      gatewayMessagePayload(alerts.en, [phoneE164]),
    );
    englishState = await resolveMessageState(client, initial);
  } catch (e) {
    englishErr = e;
    pushError(errors, "English SMS", e);
  }

  try {
    const initial = await client.send(
      gatewayMessagePayload(alerts.local, [phoneE164]),
    );
    localState = await resolveMessageState(client, initial);
  } catch (e) {
    localErr = e;
    pushError(errors, "Local-language SMS", e);
  }

  if (englishState && messageNeedsPoll(englishState)) {
    errors.push(
      "English SMS: gateway still reported Pending after waiting — keep the SMSGate app running, logged into the cloud account, with SMS permission and signal.",
    );
  }
  if (localState && messageNeedsPoll(localState)) {
    errors.push(
      "Local-language SMS: gateway still reported Pending after waiting — keep the SMSGate app running, logged into the cloud account, with SMS permission and signal.",
    );
  }

  const english = mapSendOutcome(englishState, englishErr);
  const local = mapSendOutcome(localState, localErr);

  if (english === "failed" && englishState?.recipients[0]?.error) {
    errors.push(`English SMS: ${englishState.recipients[0].error}`);
  }
  if (local === "failed" && localState?.recipients[0]?.error) {
    errors.push(`Local-language SMS: ${localState.recipients[0].error}`);
  }

  appendGenericFailureHints(errors);

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

export interface SingleSmsGatewaySendResult {
  attempted: boolean;
  skippedReason?: "not_configured" | "invalid_phone";
  status: "sent" | "failed" | "skipped";
  messageId?: string;
  errors: string[];
}

/** One SMS body via SMSGate (same credentials as {@link sendBilingualAlertsViaSmsgate}). */
export async function sendSmsTextViaSmsgate(
  phoneRaw: string,
  text: string,
): Promise<SingleSmsGatewaySendResult> {
  const username =
    process.env.SMSGATE_USERNAME?.trim() || process.env.ASG_USERNAME?.trim();
  const password =
    process.env.SMSGATE_PASSWORD?.trim() || process.env.ASG_PASSWORD?.trim();

  const phoneE164 = normalizePhoneToE164(phoneRaw);
  if (!phoneE164) {
    return {
      attempted: false,
      skippedReason: "invalid_phone",
      status: "skipped",
      errors: ["Could not normalize phone number for SMS."],
    };
  }

  if (!username || !password) {
    return {
      attempted: false,
      skippedReason: "not_configured",
      status: "skipped",
      errors: [],
    };
  }

  const client = new SmsGatewayClient(
    username,
    password,
    createFetchHttpClient(),
  );

  try {
    const initial = await client.send(gatewayMessagePayload(text, [phoneE164]));
    const state = await resolveMessageState(client, initial);
    if (messageNeedsPoll(state)) {
      return {
        attempted: true,
        status: "failed",
        messageId: state.id,
        errors: [
          "Timed out while the gateway message was still Pending. Open the SMSGate app on the phone, confirm it is logged into the cloud account, has SMS permission, and has mobile signal.",
        ],
      };
    }
    const ok = mapSendOutcome(state, undefined) === "sent";
    const recipientErr = state.recipients[0]?.error;
    const errors: string[] = ok
      ? []
      : recipientErr
        ? [recipientErr]
        : ["Send failed (no recipient error text returned)."];
    appendGenericFailureHints(errors);
    return {
      attempted: true,
      status: ok ? "sent" : "failed",
      messageId: state.id,
      errors,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const errors = [message];
    appendGenericFailureHints(errors);
    return { attempted: true, status: "failed", errors };
  }
}
