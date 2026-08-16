export type {
  PublicOrganization,
  OrganizationWithRole,
  PublicMembership,
  MembershipWithUser,
  CreateOrganizationInput,
  InviteMemberInput,
} from "./organization.types.js";

export { createOrganizationSchema, inviteMemberSchema } from "./organization.schemas.js";
export type {
  CreateOrganizationSchemaInput,
  InviteMemberSchemaInput,
} from "./organization.schemas.js";

export {
  createOrganization,
  createPersonalOrganization,
  listUserOrganizations,
  getOrganizationForUser,
  listOrganizationMembers,
  inviteMember,
  removeMember,
  OrganizationNotFoundError,
  NotOrganizationMemberError,
  UserNotFoundError,
  MembershipAlreadyExistsError,
  CannotRemoveLastOwnerError,
} from "./organization.service.js";

export {
  handleCreateOrganization,
  handleListOrganizations,
  handleGetOrganization,
  handleListMembers,
  handleInviteMember,
  handleRemoveMember,
} from "./organization.controller.js";

export { requireMembership, requireRole } from "./authorization.middleware.js";
export { organizationRouter } from "./organization.routes.js";
