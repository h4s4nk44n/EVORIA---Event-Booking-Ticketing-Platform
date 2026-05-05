import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "token";

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

export function storeToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function retrieveToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// ---------------------------------------------------------------------------
// Decode helpers (no external dependency)
// ---------------------------------------------------------------------------

/** Raw decoded JWT payload – a superset of AuthUser fields. */
interface JwtPayload {
  sub?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Decodes the base64url-encoded payload section of a JWT.
 * Does NOT verify the signature – signature verification must happen server-side.
 *
 * Returns `null` if the token is malformed.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // base64url → base64 → binary string → JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const decoded = typeof window !== "undefined"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token's `exp` claim is in the future.
 * Tokens without an `exp` are treated as non-expired (permissive).
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || payload.exp === undefined) return false;
  // exp is in seconds; Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now();
}

/**
 * Extracts `AuthUser` fields from a decoded JWT payload.
 * Returns `null` when mandatory fields (id, email) are absent.
 */
export function extractUser(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const id = (payload.sub ?? payload.id ?? "") as string;
  const email = (payload.email ?? "") as string;

  if (!id || !email) return null;

  return {
    id,
    email,
    name: (payload.name ?? email) as string,
    role: (payload.role ?? "user") as string,
  };
}
