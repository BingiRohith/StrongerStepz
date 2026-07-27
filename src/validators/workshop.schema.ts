import { z } from "zod";

export const workshopStatusSchema = z.enum(["draft", "published", "disabled", "archived"]);

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase, alphanumeric, and hyphen-separated");

const doctorSchema = z.object({ name: z.string().min(1) });
const agendaItemSchema = z.object({ icon: z.string().min(1), text: z.string().min(1) });
const faqItemSchema = z.object({ question: z.string().min(1), answer: z.string().min(1) });

/** Admin forms submit "" for a cleared optional URL field rather than omitting the key. */
const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .refine((value) => value === undefined || /^https?:\/\//.test(value), "must be a valid URL");

export const createWorkshopSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  bannerImage: z.string().min(1),
  date: z.coerce.date(),
  time: z.string().min(1),
  duration: z.string().min(1),
  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional(),
  doctors: z.array(doctorSchema).default([]),
  benefits: z.array(z.string().min(1)).default([]),
  agenda: z.array(agendaItemSchema).default([]),
  faq: z.array(faqItemSchema).default([]),
  zoomLink: optionalUrlSchema,
  whatsappCommunityLink: optionalUrlSchema,
  registrationLimit: z.number().int().positive().nullable().optional(),
  registrationOpenDate: z.coerce.date().optional(),
  registrationCloseDate: z.coerce.date().optional(),
  status: workshopStatusSchema.optional(),
  featured: z.boolean().optional(),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  slug: slugSchema,
});

export const updateWorkshopSchema = createWorkshopSchema.partial();

/** Query-string booleans arrive as the strings "true"/"false", never a real boolean. */
const queryBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const listWorkshopsQuerySchema = z.object({
  status: workshopStatusSchema.optional(),
  featured: queryBooleanSchema,
});

export type CreateWorkshopInput = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof updateWorkshopSchema>;
export type ListWorkshopsQuery = z.infer<typeof listWorkshopsQuerySchema>;
