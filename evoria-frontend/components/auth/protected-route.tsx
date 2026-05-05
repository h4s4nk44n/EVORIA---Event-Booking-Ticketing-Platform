"use client";

/**
 * <ProtectedRoute> – Client-side route guard component.
 *
 * Wraps page content and ensures:
 *  1. The user is authenticated.
 *  2. The user holds the required role (when `role` prop is provided).
 *
 * While auth state is loading it renders a full-screen spinner.
 * On failure it redirects to /login?redirect=<current_path> or /unauthorized.
 *
 * Usage:
 *   // Any authenticated user
 *   <ProtectedRoute>{children}</ProtectedRoute>
 *
 *   // Organizer-only page
 *   <ProtectedRoute role="ORGANIZER">{children}</ProtectedRoute>
 *
 *   // Multiple roles accepted
 *   <ProtectedRoute role={["ADMIN", "ORGANIZER"]}>{children}</ProtectedRoute>
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "ADMIN" | "ORGANIZER" | "ATTENDEE" | string;

interface ProtectedRouteProps {
  /** Required role(s). Omit to allow any authenticated user. */
  role?: Role | Role[];
  /** Rendered when access is granted. */
  children: React.ReactNode;
  /**
   * Custom fallback rendered while auth state is resolving.
   * Defaults to a centred loading spinner.
   */
  loadingFallback?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function hasRequiredRole(userRole: string, required: Role | Role[]): boolean {
  const normalised = userRole.toUpperCase();
  if (Array.isArray(required)) {
    return required.map((r) => r.toUpperCase()).includes(normalised);
  }
  return normalised === required.toUpperCase();
}

// ---------------------------------------------------------------------------
// Default loading spinner
// ---------------------------------------------------------------------------

function DefaultSpinner() {
  return (
    <div
      role="status"
      aria-label="Checking authentication…"
      className="flex min-h-screen items-center justify-center"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProtectedRoute({
  role,
  children,
  loadingFallback,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still hydrating auth state.
    if (isLoading) return;

    // Not authenticated → send to login with a redirect param.
    if (!user) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
      return;
    }

    // Authenticated but wrong role → send to /unauthorized.
    if (role && !hasRequiredRole(user.role, role)) {
      router.replace("/unauthorized");
    }
  }, [isLoading, user, role, router, pathname]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return <>{loadingFallback ?? <DefaultSpinner />}</>;
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!user) {
    // Effect will redirect; render nothing in the meantime.
    return null;
  }

  // ── Wrong role ─────────────────────────────────────────────────────────────
  if (role && !hasRequiredRole(user.role, role)) {
    return null;
  }

  // ── Access granted ─────────────────────────────────────────────────────────
  return <>{children}</>;
}
