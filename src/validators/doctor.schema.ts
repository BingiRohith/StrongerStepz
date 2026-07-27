import { z } from "zod";

export const createDoctorSchema = z.object({
  name: z.string().min(1),
  qualification: z.string().min(1),
  experience: z.string().min(1),
  description: z.string().min(1),
  photoUrl: z.string().min(1).optional(),
  photoPublicId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

export const updateDoctorSchema = createDoctorSchema.partial();

export const reorderDoctorsSchema = z.object({
  orderedIds: z.array(z.string()).min(1),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type ReorderDoctorsInput = z.infer<typeof reorderDoctorsSchema>;
