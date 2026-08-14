import type { Prisma, Membership, MembershipRole } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

interface CreateMembershipData {
  userId: string;
  organizationId: string;
  role: MembershipRole;
}

export const createMembership = async (
  data: CreateMembershipData,
  tx?: Prisma.TransactionClient,
): Promise<Membership> => {
  const client = tx ?? prisma;
  return client.membership.create({ data });
};

export const findMembership = async (
  userId: string,
  organizationId: string,
): Promise<Membership | null> => {
  return prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });
};

export const findUserOrganizationsWithRole = async (userId: string) => {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      organization: true,
    },
    orderBy: {
      joinedAt: "desc",
    },
  });
};

export const findOrganizationMembers = async (organizationId: string) => {
  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });
};

export const deleteMembership = async (id: string): Promise<Membership> => {
  return prisma.membership.delete({
    where: { id },
  });
};
