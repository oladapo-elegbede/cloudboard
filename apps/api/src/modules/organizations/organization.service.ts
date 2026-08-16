import type { Prisma, Organization, Membership } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";
import * as organizationRepository from "./organization.repository.js";
import * as membershipRepository from "./membership.repository.js";
import type {
  PublicOrganization,
  OrganizationWithRole,
  PublicMembership,
  MembershipWithUser,
  InviteMemberInput,
} from "./organization.types.js";

export class OrganizationNotFoundError extends Error {
  constructor(id: string) {
    super(`Organization ${id} not found`);
    this.name = "OrganizationNotFoundError";
  }
}

export class NotOrganizationMemberError extends Error {
  constructor() {
    super("You are not a member of this organization");
    this.name = "NotOrganizationMemberError";
  }
}

export class UserNotFoundError extends Error {
  constructor(email: string) {
    super(`User with email ${email} not found`);
    this.name = "UserNotFoundError";
  }
}

export class MembershipAlreadyExistsError extends Error {
  constructor() {
    super("User is already a member of this organization");
    this.name = "MembershipAlreadyExistsError";
  }
}

export class CannotRemoveLastOwnerError extends Error {
  constructor() {
    super("Cannot remove the last owner of the organization");
    this.name = "CannotRemoveLastOwnerError";
  }
}

const toPublicOrganization = (organization: Organization): PublicOrganization => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
});

const toPublicMembership = (membership: Membership): PublicMembership => ({
  id: membership.id,
  userId: membership.userId,
  organizationId: membership.organizationId,
  role: membership.role,
  joinedAt: membership.joinedAt,
});

const generateSlug = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "workspace";
};

const generateUniqueSlug = async (name: string, tx?: Prisma.TransactionClient): Promise<string> => {
  const client = tx ?? prisma;
  const baseSlug = generateSlug(name);
  let candidateSlug = baseSlug;
  let attempts = 0;

  while (attempts < 10) {
    const existing = await client.organization.findUnique({
      where: { slug: candidateSlug },
    });
    if (!existing) {
      return candidateSlug;
    }
    const suffix = Math.random().toString(36).substring(2, 8);
    candidateSlug = `${baseSlug}-${suffix}`;
    attempts++;
  }

  throw new Error("Failed to generate unique slug after 10 attempts");
};

export const createPersonalOrganization = async (
  userId: string,
  userName: string,
  tx: Prisma.TransactionClient,
): Promise<PublicOrganization> => {
  const slug = await generateUniqueSlug(`${userName}s workspace`, tx);
  const organization = await organizationRepository.createOrganization(
    { name: `${userName}'s Workspace`, slug },
    tx,
  );
  await membershipRepository.createMembership(
    { userId, organizationId: organization.id, role: "OWNER" },
    tx,
  );
  return toPublicOrganization(organization);
};

export const createOrganization = async (
  userId: string,
  name: string,
): Promise<PublicOrganization> => {
  return prisma.$transaction(async (tx) => {
    const slug = await generateUniqueSlug(name, tx);
    const organization = await organizationRepository.createOrganization({ name, slug }, tx);
    await membershipRepository.createMembership(
      { userId, organizationId: organization.id, role: "OWNER" },
      tx,
    );
    return toPublicOrganization(organization);
  });
};

export const listUserOrganizations = async (userId: string): Promise<OrganizationWithRole[]> => {
  const memberships = await membershipRepository.findUserOrganizationsWithRole(userId);
  return memberships.map((membership) => ({
    ...toPublicOrganization(membership.organization),
    role: membership.role,
  }));
};

export const getOrganizationForUser = async (
  userId: string,
  organizationId: string,
): Promise<OrganizationWithRole> => {
  const membership = await membershipRepository.findMembership(userId, organizationId);
  if (!membership) {
    throw new NotOrganizationMemberError();
  }

  const organization = await organizationRepository.findOrganizationById(organizationId);
  if (!organization) {
    throw new OrganizationNotFoundError(organizationId);
  }

  return {
    ...toPublicOrganization(organization),
    role: membership.role,
  };
};

export const listOrganizationMembers = async (
  organizationId: string,
): Promise<MembershipWithUser[]> => {
  const members = await membershipRepository.findOrganizationMembers(organizationId);
  return members.map((m) => ({
    ...toPublicMembership(m),
    user: m.user,
  }));
};

export const inviteMember = async (
  organizationId: string,
  input: InviteMemberInput,
): Promise<PublicMembership> => {
  const invitedUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!invitedUser) {
    throw new UserNotFoundError(input.email);
  }

  const existingMembership = await membershipRepository.findMembership(
    invitedUser.id,
    organizationId,
  );
  if (existingMembership) {
    throw new MembershipAlreadyExistsError();
  }

  const membership = await membershipRepository.createMembership({
    userId: invitedUser.id,
    organizationId,
    role: input.role,
  });

  return toPublicMembership(membership);
};

export const removeMember = async (organizationId: string, memberUserId: string): Promise<void> => {
  const targetMembership = await membershipRepository.findMembership(memberUserId, organizationId);
  if (!targetMembership) {
    return;
  }

  if (targetMembership.role === "OWNER") {
    const allMembers = await membershipRepository.findOrganizationMembers(organizationId);
    const ownerCount = allMembers.filter((m) => m.role === "OWNER").length;
    if (ownerCount <= 1) {
      throw new CannotRemoveLastOwnerError();
    }
  }

  await membershipRepository.deleteMembership(targetMembership.id);
};
