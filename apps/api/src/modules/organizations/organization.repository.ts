import type { Prisma, Organization } from "@prisma/client";
import { prisma } from "../../infrastructure/database/prisma.js";

interface CreateOrganizationData {
  name: string;
  slug: string;
}

export const createOrganization = async (
  data: CreateOrganizationData,
  tx?: Prisma.TransactionClient,
): Promise<Organization> => {
  const client = tx ?? prisma;
  return client.organization.create({ data });
};

export const findOrganizationById = async (id: string): Promise<Organization | null> => {
  return prisma.organization.findUnique({
    where: { id },
  });
};

export const findOrganizationBySlug = async (slug: string): Promise<Organization | null> => {
  return prisma.organization.findUnique({
    where: { slug },
  });
};
