import { apiRequest } from "./api";

export type UserData = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type AuthResponse = {
  user: UserData;
  token: string;
};

export async function loginUser(email: string, password: string) {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  if (!response.data?.token || !response.data.user) {
    throw new Error("Login response is missing user details.");
  }

  return response.data;
}

export async function createUser(name: string, email: string, password: string) {
  const response = await apiRequest<{ user: UserData }>("/auth/create-user", {
    method: "POST",
    body: { name, email, password },
  });

  if (!response.data?.user) {
    throw new Error("Signup response is missing user details.");
  }

  return response.data.user;
}
