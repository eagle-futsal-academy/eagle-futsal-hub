import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';
import { hasPermission } from '../lib/permissions';
import type { Permission } from '../lib/permissions';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  can: (permission: Permission) => boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Stored role or default
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('eaglehub_user_role') as UserRole;
    return saved || 'public';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('eaglehub_user_role', newRole);
  };

  const isAdmin = role === 'admin' || (!!session && session.user?.email !== null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // If logged in and no role selected yet or currently public, set to admin or coach
        const saved = localStorage.getItem('eaglehub_user_role') as UserRole;
        if (!saved || saved === 'public') {
          setRole('admin');
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const saved = localStorage.getItem('eaglehub_user_role') as UserRole;
        if (!saved || saved === 'public') {
          setRole('admin');
        }
      } else {
        // logged out
        const saved = localStorage.getItem('eaglehub_user_role') as UserRole;
        if (!saved) setRole('public');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 10-minute idle auto-logout timer for authenticated admin
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (session) {
        timeoutId = setTimeout(() => {
          signOut().then(() => {
            window.dispatchEvent(new CustomEvent('session-timeout'));
          });
        }, 10 * 60 * 1000);
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [session]);

  const can = (permission: Permission) => {
    return hasPermission(role, permission);
  };

  const signIn = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.data.session) {
      setRole('admin');
    }
    return res;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole('public');
  };

  const signInAnonymously = async () => {
    return supabase.auth.signInAnonymously();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isAdmin, 
      role, 
      setRole, 
      can, 
      signIn, 
      signOut, 
      signInAnonymously 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
