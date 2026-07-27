import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { TestimonialService } from "@/services/TestimonialService";

interface Params {
  id: string;
}

const service = new TestimonialService();

export const PATCH = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { id } = await params;
  const testimonial = await service.disable(id);
  return apiSuccess(testimonial);
});
