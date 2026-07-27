import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { FeedbackFormService } from "@/services/FeedbackFormService";
import { createFeedbackFormSchema } from "@/validators/feedbackForm.schema";

const service = new FeedbackFormService();

export const GET = withErrorHandling(async () => {
  const forms = await service.list();
  return apiSuccess(forms);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createFeedbackFormSchema, body);
  const form = await service.create(input);
  return apiSuccess(form, 201);
});
