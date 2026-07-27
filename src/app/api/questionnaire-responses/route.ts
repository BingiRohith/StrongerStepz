import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { QuestionnaireResponseService } from "@/services/QuestionnaireResponseService";
import {
  createQuestionnaireResponseSchema,
  listQuestionnaireResponsesQuerySchema,
} from "@/validators/questionnaireResponse.schema";

const service = new QuestionnaireResponseService();

/** Admin only, paginated + filterable by registrationId. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const query = parseOrThrow(
    listQuestionnaireResponsesQuerySchema,
    Object.fromEntries(request.nextUrl.searchParams)
  );
  const responses = await service.list(query);
  return apiSuccess(responses);
});

/** Public exception — the actual questionnaire submission. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createQuestionnaireResponseSchema, body);
  const response = await service.submit(input);
  return apiSuccess(response, 201);
});
