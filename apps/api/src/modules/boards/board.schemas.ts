import { z } from "zod";

export const createBoardSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
});

export type CreateBoardSchemaInput = z.infer<typeof createBoardSchema>;

export const updateBoardSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    description: z.string().max(2000, "Description is too long").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateBoardSchemaInput = z.infer<typeof updateBoardSchema>;
