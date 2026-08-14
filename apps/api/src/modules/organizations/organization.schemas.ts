import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
});

export type CreateOrganizationSchemaInput = z.infer<typeof createOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export type InviteMemberSchemaInput = z.infer<typeof inviteMemberSchema>;
