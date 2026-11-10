import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string) => Promise<boolean>;
  register: (username: string, email: string) => Promise<boolean>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: (promptMessage?: string) => void;
  closeAuthModal: () => void;
  authPromptMessage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string>('');

  const checkUser = useCallback(async () => {
    try {
      const storedId = localStorage.getItem('bl_user_id');
      if (storedId) {
        const res = await fetch('/api/auth/me', {
          headers: { 'x-user-id': storedId },
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setLoading(false);
          return;
        }
      }

      // Default demo login if first time
      const demoRes = await fetch('/api/auth/me', {
        headers: { 'x-user-id': 'user-demo-egoist' },
      });
      const demoData = await demoRes.json();
      if (demoData.success && demoData.user) {
        setUser(demoData.user);
        localStorage.setItem('bl_user_id', demoData.user.id);
      }
    } catch (e) {
      console.warn('Auth check failed, operating in offline/demo mode:', e);
      // Fallback local user
      setUser({
        id: 'user-demo-egoist',
        username: 'Isagi_Egoist',
        email: 'egoist@bluelock.jp',
        avatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
        role: 'egoist',
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const login = async (emailOrUsername: string): Promise<boolean> => {
    try {
      const isEmail = emailOrUsername.includes('@');
      const body = isEmail ? { email: emailOrUsername } : { username: emailOrUsername };
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('bl_user_id', data.user.id);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const register = async (username: string, email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('bl_user_id', data.user.id);
        setIsAuthModalOpen(false);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Register error:', e);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('bl_user_id');
    setUser(null);
  };

  const openAuthModal = (promptMessage?: string) => {
    setAuthPromptMessage(promptMessage || 'Unlock tactical scouting, note saving, and squad persistence.');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authPromptMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
