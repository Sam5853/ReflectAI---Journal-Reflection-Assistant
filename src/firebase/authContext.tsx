import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './config';
import { AuthUser } from '../types';

export const ADMIN_EMAIL = 'samshaikh5853@gmail.com';

export function determineRole(email?: string | null): 'admin' | 'user' {
  if (email && email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
    return 'admin';
  }
  return 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoMode: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, displayName?: string) => void;
  signInDemoUser: () => void;
  signOutUser: () => Promise<void>;
  toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'reflectai_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // If Firebase Auth is configured, listen to auth state changes
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const role = determineRole(fbUser.email);
          setUser({
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Explorer',
            email: fbUser.email,
            photoURL: fbUser.photoURL,
            isAnonymous: fbUser.isAnonymous,
            role,
          });
          setIsDemoMode(false);
        } else {
          // Check if user was using custom session previously
          const savedDemo = localStorage.getItem(DEMO_USER_KEY);
          if (savedDemo) {
            try {
              const parsed = JSON.parse(savedDemo);
              // Clean out legacy hardcoded admin session so user isn't unexpectedly logged in
              if (parsed.uid === 'demo_user_777') {
                localStorage.removeItem(DEMO_USER_KEY);
                setUser(null);
              } else {
                parsed.role = determineRole(parsed.email);
                setUser(parsed);
                setIsDemoMode(true);
              }
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Offline/Local preview mode
      const savedDemo = localStorage.getItem(DEMO_USER_KEY);
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (parsed.uid === 'demo_user_777') {
            localStorage.removeItem(DEMO_USER_KEY);
            setUser(null);
          } else {
            parsed.role = determineRole(parsed.email);
            setUser(parsed);
            setIsDemoMode(true);
          }
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        setLoading(true);
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
          const role = determineRole(result.user.email);
          const newUser: AuthUser = {
            uid: result.user.uid,
            displayName: result.user.displayName || 'Journalist',
            email: result.user.email,
            photoURL: result.user.photoURL,
            role,
          };
          setUser(newUser);
          setIsDemoMode(false);
          localStorage.removeItem(DEMO_USER_KEY);
        }
      } catch (err: any) {
        const isUserCancellation =
          err?.code === 'auth/popup-closed-by-user' ||
          err?.code === 'auth/cancelled-popup-request' ||
          err?.code === 'auth/popup-blocked' ||
          (typeof err?.message === 'string' && err.message.includes('popup-closed-by-user'));

        if (!isUserCancellation) {
          console.error('Sign In Error:', err);
          throw err;
        }
      } finally {
        setLoading(false);
      }
    } else {
      // When Firebase credentials are not yet provisioned, sign in as guest user
      signInWithEmail('guest_explorer@reflectai.internal', 'Guest Explorer');
    }
  };

  const signInWithEmail = (emailInput: string, nameInput?: string) => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    const role = determineRole(trimmedEmail);
    const displayName = nameInput?.trim() || (trimmedEmail.split('@')[0] || 'Reflector');
    // Generate safe deterministic identifier
    const safeUid = 'usr_' + btoa(trimmedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

    const newUser: AuthUser = {
      uid: safeUid,
      displayName,
      email: trimmedEmail,
      photoURL: null,
      isAnonymous: false,
      role,
    };
    setUser(newUser);
    setIsDemoMode(true);
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newUser));
  };

  const signInDemoUser = () => {
    // Legacy fallback defaults to standard user - NEVER admin
    signInWithEmail('guest_preview@reflectai.internal', 'Preview User');
  };

  const toggleRole = () => {
    // Only the single administrative email can toggle roles between admin/user
    if (!user || user.email?.toLowerCase().trim() !== ADMIN_EMAIL.toLowerCase()) {
      return;
    }
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const updated = { ...user, role: nextRole };
    setUser(updated);
    if (isDemoMode) {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
    }
  };

  const signOutUser = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    setIsDemoMode(false);
  };

  // Strictly check that only ADMIN_EMAIL has admin privileges
  const isAdmin = Boolean(
    user?.email &&
    user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase() &&
    user.role === 'admin'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        isDemoMode,
        isAdmin,
        signInWithGoogle,
        signInWithEmail,
        signInDemoUser,
        signOutUser,
        toggleRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
