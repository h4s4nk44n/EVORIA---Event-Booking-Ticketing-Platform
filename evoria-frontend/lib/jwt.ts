import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "token";

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

/**
 * Persists the JWT in both localStorage (for client-side `fetch`) AND in a
 * non-HttpOnly cookie so the Edge `middleware.ts` route guard can read it.
 *
 * Without the cookie, navigating to a protected route triggers a server-side
 * redirect to /login before the React app boots — even though the client-side
 * `state/auth` thinks the user is signed in.
 */
export function storeToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  // 7 days; SameSite=Lax is fine because login is same-origin.
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function retrieveToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Builds an unsigned JWT-shaped token whose payload carries the given role
 * (and an `exp` 24h in the future). The Edge middleware only DECODES the
 * payload – it doesn't verify the signature – so this is enough to satisfy
 * the cookie-based guard when the backend is offline and we're running in
 * demo mode. Roles are upper-cased to match `middleware.ts` ROLE_RULES.
 */
export function makeDemoJwt(email: string, role: string): string {
  const enc = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const header = enc({ alg: "none", typ: "JWT" });
  const payload = enc({
    sub: email,
    email,
    role: role.toUpperCase(),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    demo: true,
  });
  return `${header}.${payload}.demo`;
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
 * Compatible with browser, Edge runtime, and Node.js (no Buffer dependency).
 * Returns `null` if the token is malformed.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // base64url → base64 → binary string → JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    // atob is available in browsers, Edge runtime, and Node.js ≥ 16
    const binary = atob(padded);

    return JSON.parse(binary) as JwtPayload;
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
