import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000, "Comment is too long"),
});

export type CreateCommentSchemaInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000, "Comment is too long"),
});

export type UpdateCommentSchemaInput = z.infer<typeof updateCommentSchema>;
