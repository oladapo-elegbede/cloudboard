import { apiRequest } from "./api-client";

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWithRole extends PublicOrganization {
  role: MembershipRole;
}

export interface ListOrganizationsResponse {
  organizations: OrganizationWithRole[];
}

export interface GetOrganizationResponse {
  organization: OrganizationWithRole;
}

export const listOrganizations = async (accessToken: string): Promise<OrganizationWithRole[]> => {
  const result = await apiRequest<ListOrganizationsResponse>("/organizations", {
    method: "GET",
    accessToken,
  });
  return result.organizations;
};

export const getOrganization = async (
  accessToken: string,
  organizationId: string,
): Promise<OrganizationWithRole> => {
  const result = await apiRequest<GetOrganizationResponse>(`/organizations/${organizationId}`, {
    method: "GET",
    accessToken,
  });
  return result.organization;
};
