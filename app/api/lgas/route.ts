import { getAllLgas, getLgaDirectory } from "@/backend/data";

export async function GET() {
  return Response.json({
    lgas: getAllLgas(),
    items: getLgaDirectory(),
  });
}
