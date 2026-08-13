import { hashPassword } from "../auth/index.js";
import type { User } from "@prisma/client";
import type { CreateUserInput, PublicUser } from "./user.types.js";
import * as userRepository from "./user.repository.js";

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = "UserAlreadyExistsError";
  }
}

const toPublicUser = (user: User): PublicUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
};

export const createUser = async (input: CreateUserInput): Promise<PublicUser> => {
  const existingUser = await userRepository.findUserByEmail(input.email);
  if (existingUser) {
    throw new UserAlreadyExistsError(input.email);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await userRepository.createUser({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  return toPublicUser(user);
};

export const getUserById = async (id: string): Promise<PublicUser | null> => {
  const user = await userRepository.findUserById(id);
  return user ? toPublicUser(user) : null;
};
