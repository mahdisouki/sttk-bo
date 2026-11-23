const API_BASE = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: unknown;

  constructor(status: number, code: string, message: string, fields?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  formData?: FormData;
};

export async function api<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "fr",
    ...(options.headers || {}),
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body,
  });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await response.json();
    if (!response.ok || json.success === false) {
      throw new ApiError(
        response.status,
        json.code || "request_failed",
        json.message || "Request failed",
        json.fields,
      );
    }
    return json as T;
  }

  if (!response.ok) {
    throw new ApiError(response.status, "request_failed", `HTTP ${response.status}`);
  }
  return undefined as T;
}
