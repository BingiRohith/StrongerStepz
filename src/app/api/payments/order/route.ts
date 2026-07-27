import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/api/handler";
import { apiSuccess } from "@/api/response";
import { parseOrThrow } from "@/api/validate";
import { PaymentService } from "@/services/PaymentService";
import { createPaymentOrderSchema } from "@/validators/payment.schema";

const service = new PaymentService();

/**
 * Public — called by the registrant's own payment page right after
 * registering, before any admin session exists. Scoped to a single
 * registrationId the caller must already know (it was just issued to them),
 * not a general listing endpoint.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const input = parseOrThrow(createPaymentOrderSchema, body);
  const order = await service.createOrGetOrder(input.registrationId);
  return apiSuccess(order);
});
