import { z } from "zod";

export const adminRoleSchema = z.enum(["superadmin", "admin"]);

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createAdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: adminRoleSchema.optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
