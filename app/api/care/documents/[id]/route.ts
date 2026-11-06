import { readCareDocument } from "@/lib/care/service";
import { careErrorResponse } from "@/lib/care/errors";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try { return await readCareDocument((await context.params).id); }
  catch (error) { return careErrorResponse(error); }
}
