import React, {createContext, useContext, useState, useCallback, useEffect, ReactNode} from 'react';
import {authService, AuthSession, SignInCredentials, SignUpCredentials} from '../services/auth';

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
  signUp: (credentials: SignUpCredentials) => Promise<AuthSession>;
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

    return newSession;
  }, []);

  const signUp = useCallback(async (credentials: SignUpCredentials): Promise<AuthSession> => {
    const newSession = await authService.signUp(credentials);
    setSession(newSession);
    setIsAuthenticated(true);

    // Update user data
    const data = authService.getUserData();
    setUserData(data);

    return newSession;
  }, []);

  const signOut = useCallback(async () => {
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
