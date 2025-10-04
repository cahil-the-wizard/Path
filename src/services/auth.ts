import {apiClient} from './apiClient';
import {API_CONFIG} from '../config/api';

export interface AuthSession {
  sessionToken: string;
  userId: string;
  expiresAt: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

interface SupabaseAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    created_at: string;
  };
}

interface SupabaseSessionResponse {
  session_token: string;
  user_id: string;
  expires_at: string;
}

class AuthService {
  private currentSession: AuthSession | null = null;
  private supabaseUrl = 'https://lorriepsrynzoakzmlie.supabase.co';

  /**
   * Signs up a new user with email and password using Supabase Auth
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthSession> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_CONFIG.anonKey,
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        data: {
          name: credentials.name,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.msg || 'Sign up failed');
    }

    const authData: SupabaseAuthResponse = await response.json();

    // Use the Supabase JWT directly - no custom session needed!
    const session: AuthSession = {
      sessionToken: authData.access_token,
      userId: authData.user.id,
      expiresAt: new Date(authData.expires_at * 1000).toISOString(),
    };

    this.setSession(session);
    console.log('Sign up successful, JWT token set');
    return session;
  }

  /**
   * Signs in an existing user with email and password using Supabase Auth
   */
  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_CONFIG.anonKey,
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.msg || 'Sign in failed');
    }

    const authData: SupabaseAuthResponse = await response.json();

    // Use the Supabase JWT directly - no custom session needed!
    const session: AuthSession = {
      sessionToken: authData.access_token,
      userId: authData.user.id,
      expiresAt: new Date(authData.expires_at * 1000).toISOString(),
    };

    this.setSession(session);
    console.log('Sign in successful, JWT token set');
    return session;
  }

  /**
   * Signs out the current user
   */
  async signOut(): Promise<void> {
    this.currentSession = null;
    apiClient.clearSessionToken();

    // Clear from storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_session');
    }
  }

  /**
   * Sets the current session and updates the API client
   */
  setSession(session: AuthSession): void {
    this.currentSession = session;
    apiClient.setSessionToken(session.sessionToken);

    // Persist to storage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_session', JSON.stringify(session));
    }
  }

  /**
   * Gets the current session
   */
  getSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Checks if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Restores session from storage (call on app init)
   */
  async restoreSession(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const storedSession = localStorage.getItem('auth_session');
    if (!storedSession) {
      return;
    }

    try {
      const session: AuthSession = JSON.parse(storedSession);

      // Check if session is expired
      const expiresAt = new Date(session.expiresAt);
      if (expiresAt <= new Date()) {
        console.log('Session expired, clearing');
        await this.signOut();
        return;
      }

      this.setSession(session);
      console.log('Session restored from storage');
    } catch (error) {
      // Invalid session data, clear it
      console.log('Invalid session data, clearing');
      localStorage.removeItem('auth_session');
    }
  }
}

export const authService = new AuthService();
