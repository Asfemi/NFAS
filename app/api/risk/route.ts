import { findFloodRiskByLga } from "@/backend/data";
import { isNigeriaGeoDatasetError } from "@/backend/nigeria-geo";
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

  try {
    const location = await findFloodRiskByLga(lgaParam);

    if (!location) {
      return Response.json(
        {
          error: "LGA not found",
          lga: lgaParam,
          message: `No LGA catalogue entry found for: ${lgaParam}`,
        },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      data: location,
    });
  } catch (error) {
    if (isNigeriaGeoDatasetError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
