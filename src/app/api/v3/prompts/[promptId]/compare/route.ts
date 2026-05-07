import { okJson } from "../../../../../../server/http/response.js";
import { comparePromptVersions } from "../../../../../../server/services/prompt-version-service.js";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ promptId: string }> }) {
  const { promptId } = await params;
  return okJson(await comparePromptVersions(promptId));
}
