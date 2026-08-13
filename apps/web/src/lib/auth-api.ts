import { apiRequest } from "./api-client";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface GetMeResponse {
  user: PublicUser;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const registerUser = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: credentials,
  });
};

export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: credentials,
  });
};

export const refreshSession = async (): Promise<RefreshResponse> => {
  return apiRequest<RefreshResponse>("/auth/refresh", {
    method: "POST",
  });
};

export const logoutUser = async (): Promise<{ message: string }> => {
  return apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
};

export const getCurrentUser = async (accessToken: string): Promise<GetMeResponse> => {
  return apiRequest<GetMeResponse>("/users/me", {
    method: "GET",
    accessToken,
  });
};
