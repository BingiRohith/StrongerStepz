import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { TestimonialService } from "@/services/TestimonialService";
import { createTestimonialSchema } from "@/validators/testimonial.schema";

const service = new TestimonialService();

export const GET = withErrorHandling(async () => {
  const testimonials = await service.list();
  return apiSuccess(testimonials);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createTestimonialSchema, body);
  const testimonial = await service.create(input);
  return apiSuccess(testimonial, 201);
});
