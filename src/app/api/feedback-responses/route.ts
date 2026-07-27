import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { FeedbackResponseService } from "@/services/FeedbackResponseService";
import {
  listFeedbackResponsesQuerySchema,
  submitFeedbackResponseEnvelopeSchema,
} from "@/validators/feedbackResponse.schema";

const service = new FeedbackResponseService();

/** Admin only, filterable by formId, paginated. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseOrThrow(listFeedbackResponsesQuerySchema, Object.fromEntries(request.nextUrl.searchParams));
  const responses = await service.list(query);
  return apiSuccess(responses);
});

/** Public exception — the actual feedback submission. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(submitFeedbackResponseEnvelopeSchema, body);
  const response = await service.submit(input);
  return apiSuccess(response, 201);
});
