import { prisma } from "../../infrastructure/database/index.js";
import type { User } from "@prisma/client";

export const findUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const createUser = async (data: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<User> => {
  return prisma.user.create({
    data,
  });
};

export const updateLastLogin = async (id: string): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  });
};
