import {apiClient} from './apiClient';
import {API_CONFIG} from '../config/api';

export interface AuthSession {
  sessionToken: string;
  userId: string;
  expiresAt: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface SignUpResult {
  session?: AuthSession;
  requiresEmailConfirmation: boolean;
  email: string;
  accountAlreadyExists?: boolean;
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
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    created_at: string;
    email_confirmed_at?: string | null;
    confirmed_at?: string | null;
  };
  // When email confirmation is required, response is just the user object
  id?: string;
  email?: string;
  confirmation_sent_at?: string;
  identities?: any[];
  user_metadata?: {
    email_verified?: boolean;
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
   * Signs up a new user with email and password using our custom edge function
   */
  async signUp(credentials: SignUpCredentials): Promise<SignUpResult> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.anonKey}`,
        'apikey': API_CONFIG.anonKey,
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        full_name: credentials.name,
      }),
    });

    const data = await response.json();

    // Handle account already exists
    if (data.error === 'account_exists') {
      return {
        requiresEmailConfirmation: false,
        email: credentials.email,
        accountAlreadyExists: true,
      };
    }

    // Handle other errors
    if (!data.success && data.error) {
      throw new Error(data.error_description || data.error || 'Sign up failed');
    }

    // Handle successful signup with session
    if (data.success && data.session) {
      const session: AuthSession = {
        sessionToken: data.session.access_token,
        userId: data.session.user.id,
        expiresAt: new Date(data.session.expires_at * 1000).toISOString(),
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      };

      this.setSession(session);

      // Store user profile data
      this.updateUserData({
        name: credentials.name || '',
        email: credentials.email,
        avatarUrl: null,
      });

      console.log('Sign up successful, JWT token set');
      return {
        session,
        requiresEmailConfirmation: false,
        email: credentials.email,
        accountAlreadyExists: false,
      };
    }

    // Handle signup that requires email confirmation
    return {
      requiresEmailConfirmation: true,
      email: credentials.email,
      accountAlreadyExists: false,
    };
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
      // Create error with code for special handling
      const err = new Error(error.error_description || error.msg || 'Sign in failed');
      (err as any).code = error.error_code;
      throw err;
    }

    const authData: SupabaseAuthResponse = await response.json();

    // Use the Supabase JWT directly - no custom session needed!
    const session: AuthSession = {
      sessionToken: authData.access_token,
      userId: authData.user.id,
      expiresAt: new Date(authData.expires_at * 1000).toISOString(),
      refreshToken: authData.refresh_token,
      expiresIn: authData.expires_in,
    };

    this.setSession(session);

    // Fetch user metadata from Supabase
    const userMetadata = await this.fetchUserMetadata(authData.access_token);
    this.updateUserData({
      name: userMetadata?.full_name || userMetadata?.name || '',
      email: authData.user.email,
      avatarUrl: null,
    });

    console.log('Sign in successful, JWT token set');
    return session;
  }

  /**
   * Fetches user metadata from Supabase
   */
  private async fetchUserMetadata(accessToken: string): Promise<{name?: string; full_name?: string} | null> {
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': API_CONFIG.anonKey,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch user metadata');
        return null;
      }

      const userData = await response.json();
      return userData.user_metadata || null;
    } catch (error) {
      console.error('Error fetching user metadata:', error);
      return null;
    }
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
   * Refreshes the session using the stored refresh token.
   * Supabase rotates refresh tokens on each use, so we store the new one.
   */
  async refreshSession(): Promise<AuthSession> {
    const currentRefreshToken = this.currentSession?.refreshToken;
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_CONFIG.anonKey,
      },
      body: JSON.stringify({
        refresh_token: currentRefreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.msg || 'Token refresh failed');
    }

    const authData: SupabaseAuthResponse = await response.json();

    const session: AuthSession = {
      sessionToken: authData.access_token!,
      userId: authData.user!.id,
      expiresAt: new Date(authData.expires_at! * 1000).toISOString(),
      refreshToken: authData.refresh_token,
      expiresIn: authData.expires_in,
    };

    this.setSession(session);
    console.log('Session refreshed successfully');
    return session;
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

  /**
   * Gets user profile data from storage
   */
  getUserData(): {name: string; email: string; avatarUrl: string | null} {
    if (typeof localStorage === 'undefined') {
      return {name: '', email: '', avatarUrl: null};
    }

    const storedData = localStorage.getItem('user_profile');
    if (!storedData) {
      return {name: '', email: '', avatarUrl: null};
    }

    try {
      return JSON.parse(storedData);
    } catch {
      return {name: '', email: '', avatarUrl: null};
    }
  }

  /**
   * Updates user profile data in storage
   */
  updateUserData(data: Partial<{name: string; email: string; avatarUrl: string}>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const currentData = this.getUserData();
    const updatedData = {...currentData, ...data};
    localStorage.setItem('user_profile', JSON.stringify(updatedData));
  }
}

export const authService = new AuthService();
