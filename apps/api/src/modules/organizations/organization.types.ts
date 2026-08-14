import type { MembershipRole } from "@prisma/client";

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationWithRole extends PublicOrganization {
  role: MembershipRole;
}

export interface PublicMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
  joinedAt: Date;
}

export interface MembershipWithUser extends PublicMembership {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface CreateOrganizationInput {
  name: string;
}

export interface InviteMemberInput {
  email: string;
  role: MembershipRole;
}
