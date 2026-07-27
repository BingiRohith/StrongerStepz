import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { PaymentService } from "@/services/PaymentService";
import { reportPaymentOutcomeSchema } from "@/validators/payment.schema";

const service = new PaymentService();

/** Public — the payment page reports a failed attempt or a dismissed checkout modal here. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(reportPaymentOutcomeSchema, body);
  await service.recordUnsuccessfulAttempt(input.registrationId, input.outcome, input.razorpayOrderId);
  return apiSuccess({ recorded: true });
});
