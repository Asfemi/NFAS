import { buildFloodAlertResponse } from "@/backend/alerts";

interface AlertRequestBody {
  lga?: string;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AlertRequestBody | null;
  const lga = body?.lga?.trim();

  if (!lga) {
    return Response.json(
      { error: "Please provide a valid LGA." },
      { status: 400 },
    );
  }

  const data = await buildFloodAlertResponse(lga);
  if (!data) {
    return Response.json(
      { error: "LGA not found in the MVP dataset." },
      { status: 404 },
    );
  }

  return Response.json(data);
}
