/** Fields decoded from the JWT payload. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Shape returned by the /auth/login endpoint. */
export interface LoginResponse {
  token: string;
  /** Some backends also return a user object – capture it if present. */
  user?: Partial<AuthUser>;
}

/** Credentials sent to POST /auth/login. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Value exposed by the useAuth() hook. */
export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => void;
}

/** Result returned from login() so callers can react to validation errors. */
export type LoginResult =
  | { ok: true }
  | { ok: false; type: "validation"; fields: Record<string, string | string[]>; message?: string }
  | { ok: false; type: "unauthorized"; message: string }
  | { ok: false; type: "error"; message: string };
