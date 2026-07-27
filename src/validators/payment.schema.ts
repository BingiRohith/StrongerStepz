import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "must be a valid registration id");

export const createPaymentOrderSchema = z.object({
  registrationId: objectIdSchema,
});

export const verifyPaymentSchema = z.object({
  registrationId: objectIdSchema,
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const reportPaymentOutcomeSchema = z.object({
  registrationId: objectIdSchema,
  razorpayOrderId: z.string().optional(),
  outcome: z.enum(["failed", "cancelled"]),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ReportPaymentOutcomeInput = z.infer<typeof reportPaymentOutcomeSchema>;
