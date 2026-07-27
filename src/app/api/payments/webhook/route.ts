import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/api/response";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { PaymentService, type RazorpayWebhookEvent } from "@/services/PaymentService";
import { UnauthorizedError } from "@/errors/UnauthorizedError";

const service = new PaymentService();

/**
 * Razorpay calls this server-to-server — there's no admin session or user
 * request here at all, so it's authenticated purely by the webhook
 * signature (HMAC over the *raw* request body, which is why this reads
 * `request.text()` instead of `request.json()` — re-serializing parsed JSON
 * before hashing would produce a different signature and always fail).
 *
 * This is the reliable source of truth for "did this payment actually go
 * through" — the checkout-return call (`/api/payments/verify`) can be missed
 * if the user's browser never makes it back (closed tab, dropped network),
 * so `PaymentService.handleWebhookEvent` is written to be idempotent against
 * that call having already finalized the same payment, and vice versa.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedError("Invalid webhook signature");
    }

    const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    await service.handleWebhookEvent(event);

    return NextResponse.json({ success: true, data: { received: true } });
  } catch (error) {
    return apiError(error);
  }
}
