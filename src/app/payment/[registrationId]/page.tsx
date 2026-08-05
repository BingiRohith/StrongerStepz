"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { formatWorkshopDate } from "@/utils/formatWorkshopDate";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayFailureError {
  code?: string;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: { order_id?: string; payment_id?: string };
}

interface RazorpayCheckoutInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: { error?: RazorpayFailureError }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

interface OrderContext {
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  registrationNumber: string;
  registrantName: string;
  registrantEmail: string;
  registrantPhone: string;
  workshopTitle: string;
  workshopDate: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

/**
 * Registration → **Create Razorpay Order** (this page, on load) → **Razorpay
 * Checkout** (this page, on "Pay Now") → the `handler` callback below is
 * the frontend's report of success, which `handleVerify` immediately hands
 * to the backend for real signature verification — this page never marks
 * anything paid itself.
 */
export default function PaymentPage() {
  const router = useRouter();
  const params = useParams<{ registrationId: string }>();
  const registrationId = params.registrationId;

  const [order, setOrder] = useState<OrderContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function createOrder() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/payments/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationId }),
        });
        const body = (await response.json()) as ApiEnvelope<OrderContext>;

        if (!response.ok || !body.success || !body.data) {
          if (body.error?.message.includes("already been paid")) {
            router.replace(`/payment/${registrationId}/success`);
            return;
          }
          if (!cancelled) setError(body.error?.message ?? "Something went wrong. Please try again.");
          return;
        }

        if (!cancelled) setOrder(body.data);
      } catch {
        if (!cancelled) setError("Something went wrong. Please check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    createOrder();
    return () => {
      cancelled = true;
    };
  }, [registrationId, router]);

  async function reportOutcome(outcome: "failed" | "cancelled") {
    try {
      await fetch("/api/payments/outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, razorpayOrderId: order?.razorpayOrderId, outcome }),
      });
    } catch {
      // Best-effort only — the webhook is the reliable source of truth regardless of whether this lands.
    }
  }

  async function handleVerify(response: RazorpaySuccessResponse) {
    try {
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
      const body = await verifyRes.json();
      if (!verifyRes.ok || !body.success) {
        router.push(`/payment/failed?registrationId=${registrationId}`);
        return;
      }
      router.push(`/payment/${registrationId}/success`);
    } catch {
      router.push(`/payment/failed?registrationId=${registrationId}`);
    }
  }

  function handlePayNow() {
    if (!order || !window.Razorpay) return;
    setPaying(true);

    const checkout = new window.Razorpay({
      key: order.razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: "Stronger Steps",
      description: order.workshopTitle,
      order_id: order.razorpayOrderId,
      prefill: {
        name: order.registrantName,
        email: order.registrantEmail,
        contact: order.registrantPhone,
      },
      theme: { color: "#2b5c4d" },
      handler: (response) => {
        void handleVerify(response);
      },
      modal: {
        ondismiss: () => {
          setPaying(false);
          void reportOutcome("cancelled");
        },
      },
    });

    checkout.on("payment.failed", (response) => {
       
      console.error("Razorpay payment.failed", response.error);
      setPaying(false);
      void reportOutcome("failed");
      router.push(`/payment/failed?registrationId=${registrationId}`);
    });

    checkout.open();
  }

  const displayAmount = order ? (order.amount / 100).toLocaleString("en-IN") : "";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <main className="flex min-h-screen items-center justify-center bg-surface-light px-6 py-16">
        <Card className="w-full max-w-md p-10 text-center">
          <h1 className="mb-6 font-heading text-2xl text-primary-dark">Complete Your Payment</h1>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader size="lg" />
              <p className="text-ink-muted">Setting up your payment…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col gap-4">
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
              {error.includes("already been paid") && (
                <Button onClick={() => router.push(`/payment/${registrationId}/success`)}>View Payment Confirmation</Button>
              )}
              <Button variant="secondary" onClick={() => router.push("/")}>
                Return Home
              </Button>
            </div>
          ) : order ? (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl bg-surface-light p-5 text-left text-sm">
                <p className="mb-1">
                  <span className="font-semibold text-ink">Workshop:</span> {order.workshopTitle}
                </p>
                <p className="mb-1">
                  <span className="font-semibold text-ink">Date:</span> {formatWorkshopDate(new Date(order.workshopDate))}
                </p>
                <p className="mb-1">
                  <span className="font-semibold text-ink">Registration Number:</span> {order.registrationNumber}
                </p>
                <p>
                  <span className="font-semibold text-ink">Amount:</span> ₹{displayAmount}
                </p>
              </div>
              <Button size="lg" onClick={handlePayNow} disabled={!scriptReady || paying}>
                {paying ? "Processing…" : `Pay ₹${displayAmount} Now`}
              </Button>
              <p className="text-xs text-ink-muted">🔒 Payments are securely processed by Razorpay.</p>
            </div>
          ) : null}
        </Card>
      </main>
    </>
  );
}
