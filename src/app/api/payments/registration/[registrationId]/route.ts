import { withParamsErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { NotFoundError } from "@/errors/NotFoundError";
import { PaymentService } from "@/services/PaymentService";

interface Params {
  registrationId: string;
}

const service = new PaymentService();

/** Public — lets the success page re-fetch its display data on refresh without creating a new order. */
export const GET = withParamsErrorHandling<Params>(async (_request, { params }) => {
  const { registrationId } = await params;
  const context = await service.getPaymentContext(registrationId);
  if (!context) {
    throw new NotFoundError("No completed payment found for this registration");
  }
  return apiSuccess(context);
});
