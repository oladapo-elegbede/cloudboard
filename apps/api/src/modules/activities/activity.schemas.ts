import { z } from "zod";

export const listActivitiesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50),
  cursor: z.string().optional(),
});

export type ListActivitiesQueryInput = z.infer<typeof listActivitiesQuerySchema>;
