"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiPost } from "@/lib/api";
import {
  extractUser,
  isTokenExpired,
  removeToken,
  retrieveToken,
  storeToken,
} from "@/lib/jwt";

import type {
  AuthContextValue,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  LoginResult,
} from "@/types/auth";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Returns a sanitized redirect path.
 * Only allows relative paths to prevent open-redirect attacks.
 */
function sanitizeRedirect(redirect: string | null): string {
  if (!redirect) return "/";
  // Must start with / and must NOT be a protocol-relative URL (//example.com)
  if (redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return "/";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── On mount: hydrate state from localStorage ───────────────────────────
  useEffect(() => {
    const stored = retrieveToken();

    if (stored && !isTokenExpired(stored)) {
      const decoded = extractUser(stored);
      if (decoded) {
        setToken(stored);
        setUser(decoded);
      } else {
        // Token exists but payload is unusable – clear it.
        removeToken();
      }
    } else if (stored) {
      // Token is expired – clean up.
      removeToken();
    }

    setIsLoading(false);
  }, []);

  // ── login() ─────────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<LoginResult> => {
      const result = await apiPost<LoginResponse, LoginCredentials>(
        "/auth/login",
        credentials,
      );

      if (!result.ok) {
        if (result.type === "validation") {
          return {
            ok: false,
            type: "validation",
            fields: result.errors.fields,
            message: result.errors.message,
          };
        }
        if (result.type === "unauthorized") {
          return {
            ok: false,
            type: "unauthorized",
            message: "Invalid email or password.",
          };
        }
        return {
          ok: false,
          type: "error",
          message:
            result.type === "server_error"
              ? result.message
              : result.message ?? "Login failed. Please try again.",
        };
      }

      const { token: newToken } = result.data;
      const decoded = extractUser(newToken);

      if (!decoded) {
        return {
          ok: false,
          type: "error",
          message: "Received an invalid token from the server.",
        };
      }

      storeToken(newToken);
      setToken(newToken);
      setUser(decoded);

      // Redirect to the originally requested page (or home).
      const redirectTo = sanitizeRedirect(searchParams.get("redirect"));
      router.push(redirectTo);

      return { ok: true };
    },
    [],
  );

  // ── logout() ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    removeToken();
    setToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  // ── Memoized context value ────────────────────────────────────────────────
  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the current authentication state and actions.
 *
 * @throws {Error} when used outside of an `<AuthProvider>`.
 *
 * @example
 * const { user, login, logout, isLoading } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside an <AuthProvider>.");
  }
  return ctx;
}
