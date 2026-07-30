import { z } from "zod";

const statementSchema = z.string().trim().min(1).max(140);

/** Exactly 5 positive + 5 negative statements — the client's "Is This For Me?" spec is a fixed 5-and-5 layout, not an open-ended list. */
export const updateAudienceContentSchema = z.object({
  title: z.string().trim().min(1).max(120),
  positives: z.array(statementSchema).length(5),
  negatives: z.array(statementSchema).length(5),
});

export type UpdateAudienceContentInput = z.infer<typeof updateAudienceContentSchema>;

export interface AudienceContent {
  title: string;
  positives: string[];
  negatives: string[];
}
