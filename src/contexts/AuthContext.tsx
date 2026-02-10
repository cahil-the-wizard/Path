import React, {createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode} from 'react';
import {authService, AuthSession, SignInCredentials, SignUpCredentials, SignUpResult} from '../services/auth';
import {apiClient} from '../services/apiClient';
import {analytics} from '../services/analytics';

interface UserData {
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  session: AuthSession | null;
  userData: UserData;
  isInitializing: boolean;
  signIn: (credentials: SignInCredentials) => Promise<AuthSession>;
  signUp: (credentials: SignUpCredentials) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [userData, setUserData] = useState<UserData>({name: '', email: '', avatarUrl: null});
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await authService.restoreSession();
        const restoredSession = authService.getSession();
        if (restoredSession) {
          setSession(restoredSession);
          setIsAuthenticated(true);
          setUserData(authService.getUserData());
          // Identify user in analytics
          const data = authService.getUserData();
          analytics.identify(restoredSession.userId, {email: data.email, name: data.name});
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  const signIn = useCallback(async (credentials: SignInCredentials): Promise<AuthSession> => {
    const newSession = await authService.signIn(credentials);
    setSession(newSession);
    setIsAuthenticated(true);

    // Update user data
    const data = authService.getUserData();
    setUserData(data);

    // Identify user in analytics
    analytics.identify(newSession.userId, {email: data.email, name: data.name});
    analytics.track('user_signed_in');

    return newSession;
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    const result = await authService.signUp(credentials);

    // Only set session if email confirmation is not required
    if (result.session && !result.requiresEmailConfirmation) {
      setSession(result.session);
      setIsAuthenticated(true);

      // Update user data
      const data = authService.getUserData();
      setUserData(data);

      // Identify user in analytics
      analytics.identify(result.session.userId, {email: data.email, name: data.name});
      analytics.track('user_signed_up');
    }

    return result;
  }, []);

  const signOut = useCallback(async () => {
    analytics.track('user_signed_out');
    analytics.reset();
    await authService.signOut();
    setSession(null);
    setIsAuthenticated(false);
    setUserData({name: '', email: '', avatarUrl: null});
  }, []);

  // Register apiClient callbacks for 401 handling
  useEffect(() => {
    apiClient.onUnauthorized(() => {
      signOut();
    });

    apiClient.onRefreshToken(async () => {
      const newSession = await authService.refreshSession();
      setSession(newSession);
      return newSession.sessionToken;
    });
  }, [signOut]);

  // Proactive refresh timer — refresh 5 minutes before expiry
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!session?.expiresAt || !session.refreshToken) return;

    const expiresAt = new Date(session.expiresAt).getTime();
    const now = Date.now();
    const msUntilRefresh = expiresAt - now - 5 * 60 * 1000; // 5 min before expiry

    if (msUntilRefresh <= 0) {
      // Already within 5 min of expiry — refresh immediately
      authService.refreshSession()
        .then(newSession => setSession(newSession))
        .catch(() => signOut());
      return;
    }

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const newSession = await authService.refreshSession();
        setSession(newSession);
      } catch {
        signOut();
      }
    }, msUntilRefresh);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [session?.expiresAt, session?.refreshToken, signOut]);

  // Tab resume — check session when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || !session) return;

      try {
        const status = await apiClient.checkSession();
        if (!status.valid) {
          signOut();
        } else if (status.expires_in !== undefined && status.expires_in < 300) {
          // Less than 5 minutes left — proactively refresh
          const newSession = await authService.refreshSession();
          setSession(newSession);
        }
      } catch {
        // checkSession failed (possibly offline) — don't sign out, just log
        console.warn('Session check failed on tab resume');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session, signOut]);

  const updateUserData = useCallback((data: Partial<UserData>) => {
    authService.updateUserData(data);
    setUserData(prev => ({...prev, ...data}));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        session,
        userData,
        isInitializing,
        signIn,
        signUp,
        signOut,
        updateUserData,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
