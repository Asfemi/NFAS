import { getAllLgas, getAllLgasWithStates, getFloodRiskStats } from "@/backend/data";
import { NIGERIAN_LGAS } from "@/backend/lgas";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format");
  const state = searchParams.get("state");

  // Filter by state if provided
  if (state) {
    const lgasInState = NIGERIAN_LGAS.filter(
      (lga) => lga.state.toLowerCase() === state.toLowerCase(),
    ).sort((a, b) => a.name.localeCompare(b.name));

    if (lgasInState.length === 0) {
      return Response.json({
        error: "State not found",
        state,
        message: `No LGAs found for state: ${state}`,
      }, { status: 404 });
    }

    return Response.json({
      state,
      count: lgasInState.length,
      lgas: lgasInState,
    });
  }

  // Return comprehensive format if requested
  if (format === "full") {
    const stats = getFloodRiskStats();
    return Response.json({
      metadata: {
        totalStates: new Set(NIGERIAN_LGAS.map((lga) => lga.state)).size,
        ...stats,
      },
      lgas: getAllLgasWithStates(),
    });
  }

  // Return simple list by default
  return Response.json({
    count: NIGERIAN_LGAS.length,
    lgas: getAllLgas(),
  });
}
