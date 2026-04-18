import { getAllLgas, getLgaDirectory } from "@/backend/data";
import { isNigeriaGeoDatasetError } from "@/backend/nigeria-geo";

export async function GET() {
  try {
    const [lgas, items] = await Promise.all([getAllLgas(), getLgaDirectory()]);
    return Response.json({ lgas, items });
  } catch (error) {
    if (isNigeriaGeoDatasetError(error)) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
