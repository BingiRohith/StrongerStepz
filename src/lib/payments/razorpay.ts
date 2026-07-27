import crypto from "node:crypto";
import Razorpay from "razorpay";

/**
 * Thin wrapper around the Razorpay SDK plus both signature-verification
 * schemes it uses. Everything here reads credentials from `process.env` at
 * call time — switching from test mode to live mode is purely swapping
 * `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` /
 * `NEXT_PUBLIC_RAZORPAY_KEY_ID` for their `rzp_live_*` equivalents; nothing
 * in this file (or anything that calls it) is mode-specific.
 */

function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET environment variables are not set");
  }
  return { keyId, keySecret };
}

let cachedClient: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (cachedClient) return cachedClient;
  const { keyId, keySecret } = getRazorpayCredentials();
  cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return cachedClient;
}

export interface CreateOrderParams {
  amountInRupees: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
}

export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: Math.round(params.amountInRupees * 100), // Razorpay amounts are in the smallest currency subunit (paise for INR)
    currency: params.currency ?? "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
  return { id: order.id, amount: Number(order.amount), currency: order.currency };
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/** Standard Checkout's post-payment verification: HMAC-SHA256(`${orderId}|${paymentId}`, key_secret) === signature. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = getRazorpayCredentials();
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeCompare(expected, signature);
}

/** Webhook verification: HMAC-SHA256(raw request body, webhook secret) === the `X-Razorpay-Signature` header. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET environment variable is not set");
  }
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeCompare(expected, signature);
}

/** The publishable key id the Checkout modal needs client-side — never the secret. */
export function getPublicRazorpayKeyId(): string {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID environment variable is not set");
  }
  return keyId;
}
