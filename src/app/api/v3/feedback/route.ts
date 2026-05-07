import { errorJson, okJson } from "../../../../server/http/response.js";
import { submitFeedbackV3 } from "../../../../server/services/feedback-loop-service.js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const promptId = String(body.promptId ?? "").trim();
  const promptVersionId = String(body.promptVersionId ?? body.versionId ?? "").trim();
  if (!promptId || !promptVersionId) {
    return errorJson("FEEDBACK_IDS_REQUIRED", "缺少 promptId 或 promptVersionId", "promptId and promptVersionId are required", 400);
  }
  const result = await submitFeedbackV3({
    ...(body.eventId ? { eventId: String(body.eventId) } : {}),
    promptId,
    promptVersionId,
    userScore: Number(body.userScore ?? 0),
    starRating: Number(body.starRating ?? 0),
    preference: body.preference,
    userNotes: String(body.userNotes ?? ""),
  });
  return okJson(result);
}
