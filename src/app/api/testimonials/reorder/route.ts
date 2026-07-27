import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { TestimonialService } from "@/services/TestimonialService";
import { reorderTestimonialsSchema } from "@/validators/testimonial.schema";

const service = new TestimonialService();

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { orderedIds } = parseOrThrow(reorderTestimonialsSchema, body);
  await service.reorder(orderedIds);
  return apiSuccess({ reordered: true });
});
