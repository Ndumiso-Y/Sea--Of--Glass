import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserSession, Role, Department } from '@/data/types';

interface AuthContextType {
  user: UserSession | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<UserSession | null>;
  logout: () => Promise<void>;
  hasAccess: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserSession(authId: string): Promise<UserSession | null> {
  // Look up member by auth_id (decouples auth.uid() from members.id)
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('auth_id', authId)
    .single();

  if (!member) return null;

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('*')
    .eq('member_id', member.id)
    .single();

  return {
    memberId: member.id,
    role: ((roleRow?.role ?? member.duty_title) as Role),
    name: member.name,
    department: ((roleRow?.department ?? member.department) as Department),
    cell: roleRow?.cell ?? member.cell,
    ministry_id: roleRow?.ministry_id ?? undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userSession = await fetchUserSession(session.user.id);
        setUser(userSession);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Keep user session in sync after a token refresh
        const userSession = await fetchUserSession(session.user.id);
        if (userSession) setUser(userSession);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserSession | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) return null;
    // Set user immediately so ProtectedRoute sees it before navigate() fires
    const userSession = await fetchUserSession(data.session.user.id);
    if (!userSession) return null;
    setUser(userSession);
    return userSession;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const hasAccess = useCallback((allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
