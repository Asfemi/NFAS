import { buildFloodAlertResponse } from "@/backend/alerts";
import { isFloodForecastUnavailableError } from "@/backend/forecast-error";
import { isNigeriaGeoDatasetError } from "@/backend/nigeria-geo";
import { isLikelyValidPhone } from "@/backend/phone";
import { sendBilingualAlertsViaSmsgate } from "@/backend/smsgate";
import type { PersonalizedAlertInput } from "@/backend/types";

interface AlertRequestBody {
  lga?: string;
  phone?: string;
  farmInfo?: string;
  extraInfo?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AlertRequestBody | null;
  const lga = body?.lga?.trim();
  const phone = body?.phone?.trim();
  const farmInfo = body?.farmInfo?.trim();
  const extraInfo = body?.extraInfo?.trim();

  if (!lga) {
    return Response.json(
      { error: "Please provide a valid LGA." },
      { status: 400 },
    );
  }

  const wantsPersonalized = Boolean(phone || farmInfo || extraInfo);
  let personalized: PersonalizedAlertInput | null = null;
  if (wantsPersonalized) {
    if (!phone) {
      return Response.json(
        { error: "Phone number is required for tailored alerts." },
        { status: 400 },
      );
    }
    if (!isLikelyValidPhone(phone)) {
      return Response.json(
        { error: "Please enter a valid phone number (10–15 digits)." },
        { status: 400 },
      );
    }
    personalized = {
      phone,
      ...(farmInfo ? { farmInfo } : {}),
      ...(extraInfo ? { extraInfo } : {}),
    };
  }

  try {
    const data = await buildFloodAlertResponse(lga, personalized);
    if (!data) {
      return Response.json(
        { error: "LGA not found in the current dataset." },
        { status: 404 },
      );
    }

    if (personalized) {
      const smsDelivery = await sendBilingualAlertsViaSmsgate(
        personalized.phone,
        data.alerts,
      );
      return Response.json({ ...data, smsDelivery });
    }

    return Response.json(data);
  } catch (error) {
    if (isFloodForecastUnavailableError(error)) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    if (isNigeriaGeoDatasetError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
