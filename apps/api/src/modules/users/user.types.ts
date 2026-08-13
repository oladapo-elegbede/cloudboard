export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}
