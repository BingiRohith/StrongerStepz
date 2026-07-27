import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { PaymentService } from "@/services/PaymentService";
import { verifyPaymentSchema } from "@/validators/payment.schema";

const service = new PaymentService();

/**
 * Public — this is the frontend's post-checkout report of success, which is
 * exactly why it's never trusted at face value: `PaymentService.verifyAndCapture`
 * re-derives the Razorpay signature server-side before touching the database.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(verifyPaymentSchema, body);
  const result = await service.verifyAndCapture(input);
  return apiSuccess(result);
});
