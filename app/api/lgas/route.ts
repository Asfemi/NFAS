import { getAllLgas } from "@/backend/data";

export async function GET() {
  return Response.json({ lgas: getAllLgas() });
}
