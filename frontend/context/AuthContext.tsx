'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email?: string;
  username: string;
  handle: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  discordId?: string;
  discordTag?: string;
  inGuild: boolean;
  hasWl: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (loginVal: string, password: string) => Promise<void>;
  loginWithDiscord: (payload: { code?: string; persona?: string; redirectUri?: string }) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  handle: string;
  bio?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Przywróć sesję z localStorage przy starcie
  useEffect(() => {
    const savedToken = localStorage.getItem('yt_token');
    const savedUser = localStorage.getItem('yt_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('yt_token');
        localStorage.removeItem('yt_user');
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithDiscord = async (payload: { code?: string; persona?: string; redirectUri?: string }) => {
    const redirectUri = payload.redirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined);
    const { data } = await api.post('/auth/discord', { ...payload, redirectUri });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('yt_token', data.token);
    localStorage.setItem('yt_user', JSON.stringify(data.user));
  };

  const login = async (loginVal: string, password: string) => {
    const { data } = await api.post('/auth/login', { login: loginVal, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('yt_token', data.token);
    localStorage.setItem('yt_user', JSON.stringify(data.user));
  };

  const register = async (formData: RegisterData) => {
    const { data } = await api.post('/auth/register', formData);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('yt_token', data.token);
    localStorage.setItem('yt_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('yt_token');
    localStorage.removeItem('yt_user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, loginWithDiscord, register, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
