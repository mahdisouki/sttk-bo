import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  language?: string;
  firstName?: string;
  lastName?: string;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  ready: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  displayName: string;
  login: (email: string, password: string) => Promise<LoginResult>;
  setup2fa: () => Promise<{ otpauthUrl: string; secret: string }>;
  confirm2fa: (code: string) => Promise<void>;
  verify2fa: (code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: <T = any>(path: string, options?: Parameters<typeof api>[1]) => Promise<T>;
};

export type LoginResult =
  | { kind: "session" }
  | { kind: "verify" }
  | { kind: "setup" };

const STORAGE_KEY = "mv.backoffice.session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [purposeToken, setPurposeToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStored());
    setReady(true);
  }, []);

  const persist = useCallback((next: Session | null) => {
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const applySession = useCallback(
    (payload: any) => {
      const next: Session = {
        accessToken: payload.accessToken || payload.data?.accessToken,
        refreshToken: payload.refreshToken || payload.data?.refreshToken,
        user: payload.user || payload.data?.user,
      };
      setPurposeToken(null);
      persist(next);
    },
    [persist],
  );

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await api<{ success: true; data: any }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const data = result.data;
    if (data.requires2faSetup) {
      setPurposeToken(data.setupToken);
      return { kind: "setup" };
    }
    if (data.requires2fa) {
      setPurposeToken(data.pendingToken);
      return { kind: "verify" };
    }
    applySession(data);
    return { kind: "session" };
  }, [applySession]);

  const setup2fa = useCallback(async () => {
    if (!purposeToken) throw new Error("Token 2FA manquant");
    const result = await api<{ success: true; data: { otpauthUrl: string; secret: string } }>(
      "/auth/2fa/setup",
      { method: "POST", token: purposeToken },
    );
    return result.data;
  }, [purposeToken]);

  const confirm2fa = useCallback(
    async (code: string) => {
      if (!purposeToken) throw new Error("Token 2FA manquant");
      const result = await api<{ success: true; data: any }>("/auth/2fa/confirm", {
        method: "POST",
        token: purposeToken,
        body: { code },
      });
      applySession(result.data);
    },
    [applySession, purposeToken],
  );

  const verify2fa = useCallback(
    async (code: string) => {
      if (!purposeToken) throw new Error("Token 2FA manquant");
      const result = await api<{ success: true; data: any }>("/auth/2fa/verify", {
        method: "POST",
        token: purposeToken,
        body: { code },
      });
      applySession(result.data);
    },
    [applySession, purposeToken],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await api("/auth/password/forgot", { method: "POST", body: { email } });
  }, []);

  const logout = useCallback(async () => {
    try {
      if (session?.accessToken) {
        await api("/auth/logout", { method: "POST", token: session.accessToken });
      }
    } catch {
      // ignore logout network errors
    }
    setPurposeToken(null);
    persist(null);
  }, [persist, session?.accessToken]);

  const authFetch = useCallback(
    async <T,>(path: string, options: Parameters<typeof api>[1] = {}) => {
      return api<T>(path, { ...options, token: options.token ?? session?.accessToken });
    },
    [session?.accessToken],
  );

  const user = session?.user || null;
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Utilisateur";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken: session?.accessToken || null,
      ready,
      isAdmin: user?.role === "admin",
      isAgent: user?.role === "agent",
      displayName,
      login,
      setup2fa,
      confirm2fa,
      verify2fa,
      forgotPassword,
      logout,
      authFetch,
    }),
    [
      user,
      session?.accessToken,
      ready,
      displayName,
      login,
      setup2fa,
      confirm2fa,
      verify2fa,
      forgotPassword,
      logout,
      authFetch,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
