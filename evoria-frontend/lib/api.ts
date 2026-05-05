/**
 * Centralized API client for EVORIA frontend.
 *
 * Features:
 *  - Base URL from NEXT_PUBLIC_API_URL environment variable
 *  - Automatic JWT attachment from localStorage (Authorization: Bearer)
 *  - Structured error handling: 401 → redirect to login, 400 → validation errors, 500 → generic
 *  - Type-safe request/response generics
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape returned when a 400 Bad Request carries field-level validation errors. */
export interface ValidationErrors {
  /** Maps field names to their error messages. */
  fields: Record<string, string | string[]>;
  /** Optional top-level message accompanying the validation failure. */
  message?: string;
}

/** Discriminated union representing every possible outcome of an API call. */
export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; type: "validation"; errors: ValidationErrors; status: 400 }
  | { ok: false; type: "unauthorized"; status: 401 }
  | { ok: false; type: "server_error"; message: string; status: number }
  | { ok: false; type: "network_error"; message: string; status: null };

/** Options forwarded to the underlying fetch call (minus method/body/headers,
 *  which are controlled by the helper functions). */
export type ApiRequestOptions = Omit<RequestInit, "method" | "body" | "headers">;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

/** Retrieves the stored JWT token (only runs in browser environments). */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Builds common request headers, injecting the Bearer token when available. */
function buildHeaders(extra: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Core fetch wrapper.
 *
 * @param method   HTTP verb (GET, POST, PUT, DELETE, …)
 * @param path     API path relative to BASE_URL (e.g. "/api/events")
 * @param body     Optional request body (will be JSON-stringified)
 * @param options  Additional RequestInit options forwarded to fetch
 */
async function request<TResponse>(
  method: string,
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<ApiResult<TResponse>> {
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // ── 401 Unauthorized ──────────────────────────────────────────────────
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        // Clear stale token and redirect to the login page.
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return { ok: false, type: "unauthorized", status: 401 };
    }

    // ── 400 Bad Request (validation errors) ───────────────────────────────
    if (response.status === 400) {
      let errors: ValidationErrors = { fields: {} };
      try {
        const json = await response.json();
        // Try to normalise common server shapes:
        //   { errors: { field: "msg" } }  |  { message, errors }  |  plain object
        if (json && typeof json === "object") {
          errors = {
            fields: json.errors ?? json.fields ?? {},
            message: json.message,
          };
        }
      } catch {
        // Body was not valid JSON – return an empty validation errors object.
      }
      return { ok: false, type: "validation", errors, status: 400 };
    }

    // ── 5xx Server errors ─────────────────────────────────────────────────
    if (response.status >= 500) {
      let message = `Server error (${response.status})`;
      try {
        const json = await response.json();
        if (json?.message) message = json.message;
      } catch {
        // Ignore non-JSON bodies.
      }
      return { ok: false, type: "server_error", message, status: response.status };
    }

    // ── 2xx / other success ───────────────────────────────────────────────
    // Handle 204 No Content and other empty responses gracefully.
    let data: TResponse;
    const contentType = response.headers.get("content-type") ?? "";
    if (response.status === 204 || !contentType.includes("application/json")) {
      data = undefined as unknown as TResponse;
    } else {
      data = (await response.json()) as TResponse;
    }

    return { ok: true, data, status: response.status };
  } catch (err) {
    // Network-level failures (offline, DNS failure, CORS abort, etc.)
    const message =
      err instanceof Error ? err.message : "An unexpected network error occurred";
    return { ok: false, type: "network_error", message, status: null };
  }
}

// ---------------------------------------------------------------------------
// Public API helpers
// ---------------------------------------------------------------------------

/**
 * Sends a GET request.
 *
 * @example
 * const result = await apiGet<Event[]>("/api/events");
 * if (result.ok) console.log(result.data);
 */
export function apiGet<TResponse>(
  path: string,
  options?: ApiRequestOptions,
): Promise<ApiResult<TResponse>> {
  return request<TResponse>("GET", path, undefined, options);
}

/**
 * Sends a POST request with a JSON body.
 *
 * @example
 * const result = await apiPost<{ id: string }>("/api/events", { name: "Jazz Night" });
 */
export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions,
): Promise<ApiResult<TResponse>> {
  return request<TResponse>("POST", path, body, options);
}

/**
 * Sends a PUT request with a JSON body.
 *
 * @example
 * const result = await apiPut<Event>("/api/events/123", updatedEvent);
 */
export function apiPut<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: ApiRequestOptions,
): Promise<ApiResult<TResponse>> {
  return request<TResponse>("PUT", path, body, options);
}

/**
 * Sends a DELETE request.
 *
 * @example
 * const result = await apiDelete<void>("/api/events/123");
 */
export function apiDelete<TResponse = void>(
  path: string,
  options?: ApiRequestOptions,
): Promise<ApiResult<TResponse>> {
  return request<TResponse>("DELETE", path, undefined, options);
}
