import { getLgaRiskRecord } from "@/backend/data";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lgaParam = searchParams.get("lga");

  if (!lgaParam) {
    return Response.json(
      {
        error: "Missing 'lga' query parameter",
        message: "Please provide an LGA name using ?lga=<lga_name>",
        example: "/api/risk?lga=Lokoja",
      },
      { status: 400 },
    );
  }

  const riskRecord = getLgaRiskRecord(lgaParam);

  if (!riskRecord) {
    return Response.json(
      {
        error: "LGA not found",
        lga: lgaParam,
        message: `No flood risk data found for LGA: ${lgaParam}`,
      },
      { status: 404 },
    );
  }

  return Response.json({
    data: riskRecord,
    success: true,
  });
}
