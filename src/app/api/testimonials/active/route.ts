import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { TestimonialService } from "@/services/TestimonialService";

const service = new TestimonialService();

/** Public read — the future `TestimonialsSection` fetches active testimonials in display order. */
export const GET = withErrorHandling(async () => {
  const testimonials = await service.getActiveOrdered();
  return apiSuccess(testimonials);
});
