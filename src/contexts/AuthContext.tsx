import React, {createContext, useContext, useState, useCallback, useEffect, ReactNode} from 'react';
import {authService, AuthSession, SignInCredentials, SignUpCredentials, SignUpResult} from '../services/auth';
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
