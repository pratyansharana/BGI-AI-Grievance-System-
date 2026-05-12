import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthCtx {
  isAuthed: boolean;
  email: string | null;
  login: (email: string) => void;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "lokawaaz-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (v) setEmail(v);
    setReady(true);
  }, []);

  const login = (e: string) => {
    setEmail(e);
    localStorage.setItem(KEY, e);
  };
  const logout = () => {
    setEmail(null);
    localStorage.removeItem(KEY);
  };

  return (
    <Ctx.Provider value={{ isAuthed: !!email, email, login, logout, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
