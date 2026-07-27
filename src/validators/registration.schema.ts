import { z } from "zod";

export const registrationStatusSchema = z.enum(["pending_payment", "confirmed", "cancelled"]);
export const registrationPaymentStatusSchema = z.enum(["n/a", "pending", "paid", "failed", "cancelled", "refunded"]);
export const registrationGenderSchema = z.enum(["male", "female", "other", "prefer_not_to_say"]);

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "must be a valid workshop id");

export const createRegistrationSchema = z.object({
  workshopId: objectIdSchema,
  name: z.string().min(1, "Full name is required"),
  phone: z
    .string()
    .min(7, "Enter a valid mobile number")
    .max(15, "Enter a valid mobile number")
    .regex(/^[0-9+\-\s]+$/, "Enter a valid mobile number"),
  email: z.string().email("Enter a valid email address"),
  age: z.coerce.number().int().min(1, "Enter a valid age").max(120, "Enter a valid age"),
  gender: registrationGenderSchema,
  city: z.string().min(1, "City is required"),
  source: z.string().optional(),
});

export const updateRegistrationSchema = z.object({
  status: registrationStatusSchema.optional(),
  joinedCommunity: z.boolean().optional(),
  paymentStatus: registrationPaymentStatusSchema.optional(),
});

const queryBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const listRegistrationsQuerySchema = z.object({
  workshopId: objectIdSchema.optional(),
  status: registrationStatusSchema.optional(),
  paymentStatus: registrationPaymentStatusSchema.optional(),
  joinedCommunity: queryBooleanSchema,
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;
export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;
