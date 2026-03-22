import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserSession, Role, Member } from '@/data/types';
import { members, loginCredentials } from '@/data/seed';

interface AuthContextType {
  user: UserSession | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  hasAccess: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);

  const login = useCallback((email: string, password: string): boolean => {
    const cred = loginCredentials.find(c => c.email === email && c.password === password);
    if (!cred) return false;
    const member = members.find(m => m.id === cred.memberId);
    if (!member) return false;
    setUser({
      memberId: member.id,
      role: member.duty_title,
      name: member.name,
      department: member.department,
      cell: member.cell,
    });
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const hasAccess = useCallback((allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
