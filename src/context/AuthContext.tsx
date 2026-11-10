import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    usernameOrData: string | { username: string; email?: string; phone?: string; password?: string },
    email?: string,
    phone?: string,
    password?: string
  ) => Promise<{ success: boolean; message?: string }>;
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
        } else {
          localStorage.removeItem('bl_user_id');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Auth check failed:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('bl_user_id', data.user.id);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, message: 'Server connection failed' };
    }
  };

  const register = async (
    usernameOrData: string | { username: string; email?: string; phone?: string; password?: string },
    emailParam?: string,
    phoneParam?: string,
    passwordParam?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      let body: any;
      if (typeof usernameOrData === 'object') {
        body = usernameOrData;
      } else {
        body = {
          username: usernameOrData,
          email: emailParam,
          phone: phoneParam,
          password: passwordParam,
        };
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('bl_user_id', data.user.id);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (e) {
      console.error('Register error:', e);
      return { success: false, message: 'Server connection failed' };
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
