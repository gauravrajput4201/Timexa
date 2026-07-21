import Constants from "expo-constants";
import { Platform } from "react-native";

export type ApiEnvelope<T> = {
  success: boolean;
  status: number;
  message: string;
  data?: T;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const getDevHost = () => {
  const manifest = Constants.manifest as { debuggerHost?: string } | null;
  const manifest2 = Constants.manifest2 as {
    extra?: { expoClient?: { hostUri?: string } };
  } | null;
  const hostUri =
    Constants.expoConfig?.hostUri ||
    manifest2?.extra?.expoClient?.hostUri ||
    manifest?.debuggerHost;

  return hostUri?.split(":")[0];
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000/api"
    : `http://${getDevHost() || "localhost"}:3000/api`);

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  let json: ApiEnvelope<T> | undefined;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    json = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(
      "Unable to connect to Timexa server. Check that the backend is running.",
      0,
    );
  }

  if (!response.ok || json?.success === false) {
    throw new ApiError(
      json?.message || "Something went wrong. Please try again.",
      json?.status || response.status,
      json?.data,
    );
  }

  return json;
}

export const isNetworkError = (err: unknown): boolean =>
  err instanceof ApiError && err.status === 0;
