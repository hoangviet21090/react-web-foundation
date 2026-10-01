import { createContext } from 'react';
import type { AuthSession } from '@/features/auth/application/auth-session';
export const AuthContext = createContext<AuthSession | null>(null);
