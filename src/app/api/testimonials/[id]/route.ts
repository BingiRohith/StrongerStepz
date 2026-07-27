import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { TestimonialService } from "@/services/TestimonialService";
import { updateTestimonialSchema } from "@/validators/testimonial.schema";

interface Params {
  id: string;
}

const service = new TestimonialService();

export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const testimonial = await service.getById(id);
  return apiSuccess(testimonial);
});

export const PATCH = withParamsErrorHandling<Params>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const input = parseOrThrow(updateTestimonialSchema, body);
  const testimonial = await service.update(id, input);
  return apiSuccess(testimonial);
});

export const DELETE = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  await service.delete(id);
  return apiSuccess({ deleted: true });
});
