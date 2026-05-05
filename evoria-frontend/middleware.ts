/**
 * Next.js Edge Middleware – Route Protection & Role-Based Access Control
 *
 * Runs on every request that matches `config.matcher`.
 * Reads the JWT from:
 *   1. Cookie: `token`
 *   2. Authorization: Bearer <token> header
 *
 * Role rules:
 *   /admin/*      → ADMIN
 *   /dashboard/*  → ORGANIZER
 *   /bookings/*   → ATTENDEE
 *
 * Unauthenticated → /login?redirect=<original_path>
 * Wrong role      → /unauthorized  (or /login if no token at all)
 */

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Route → required role mapping
// ---------------------------------------------------------------------------

const ROLE_RULES: { prefix: string; role: string }[] = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/dashboard", role: "ORGANIZER" },
  { prefix: "/bookings", role: "ATTENDEE" },
];

/** Paths that require authentication but NOT a specific role. */
const AUTH_REQUIRED_PREFIXES = ["/profile", "/settings"];

// ---------------------------------------------------------------------------
// Tiny Edge-compatible JWT decoder (no Node.js Buffer / crypto needed for decode)
// ---------------------------------------------------------------------------

interface JwtPayload {
  sub?: string;
  id?: string;
  email?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decodes the payload section of a JWT without verifying the signature.
 * Signature verification must happen server-side via a trusted secret.
 * Returns `null` for malformed tokens.
 */
function decodePayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // base64url → standard base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Pad to a multiple of 4
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    // In the Edge runtime `atob` is available globally
    const binary = atob(padded);
    return JSON.parse(binary) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  if (payload.exp === undefined) return false;
  return payload.exp * 1000 < Date.now();
}

// ---------------------------------------------------------------------------
// Token extraction
// ---------------------------------------------------------------------------

function extractToken(req: NextRequest): string | null {
  // 1. HttpOnly / JS-readable cookie named "token"
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) return cookieToken;

  // 2. Authorization: Bearer <token> header
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Redirect helpers
// ---------------------------------------------------------------------------

function toLogin(req: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

function toUnauthorized(req: NextRequest): NextResponse {
  return NextResponse.redirect(new URL("/unauthorized", req.url));
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  // ── Determine required role (if any) ──────────────────────────────────────
  const roleRule = ROLE_RULES.find((r) => pathname.startsWith(r.prefix));
  const requiresAuth =
    roleRule !== undefined ||
    AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // ── Extract & decode token ─────────────────────────────────────────────────
  const token = extractToken(req);

  if (!token) {
    return toLogin(req, pathname);
  }

  const payload = decodePayload(token);

  if (!payload || isExpired(payload)) {
    // Treat expired / malformed token as unauthenticated
    return toLogin(req, pathname);
  }

  // ── Role check ─────────────────────────────────────────────────────────────
  if (roleRule) {
    const userRole = (payload.role ?? "").toUpperCase();
    if (userRole !== roleRule.role) {
      // User is authenticated but lacks the required role
      return toUnauthorized(req);
    }
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher – only run middleware on these path patterns
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (static assets)
     *  - _next/image   (Next image optimisation)
     *  - favicon.ico
     *  - Public assets (files with extensions in /public)
     *  - /login, /register, /unauthorized (auth pages themselves)
     *  - /api/* (API routes handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)|login|register|unauthorized|api/).*)",
  ],
};
