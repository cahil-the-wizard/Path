import {API_CONFIG, API_ENDPOINTS} from '../config/api';
import type {
  Task,
  Step,
  QueueStatus,
  GetTasksResponse,
  GetTaskStepsResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  UpdateStepResponse,
  AddStepResponse,
  SplitStepResponse,
  RewriteStepResponse,
  RewriteTaskResponse,
  GetTasksSummaryResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateStepRequest,
  AddStepRequest,
  SplitStepRequest,
  RewriteStepRequest,
  RewriteTaskRequest,
  GetTasksParams,
  GetTaskStepsParams,
  GetTasksSummaryParams,
  GetPreferencesResponse,
  UpdatePreferencesRequest,
} from '../types/backend';

export interface ApiErrorResponse {
  error: string;
  error_code?: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_MISSING' | 'UNAUTHORIZED';
  message?: string;
}

type UnauthorizedCallback = () => void;
type RefreshTokenCallback = () => Promise<string>;

class ApiClient {
  private baseUrl: string;
  private anonKey: string;
  private sessionToken: string | null = null;
  private unauthorizedCallback: UnauthorizedCallback | null = null;
  private refreshTokenCallback: RefreshTokenCallback | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.anonKey = API_CONFIG.anonKey;
  }

  onUnauthorized(cb: UnauthorizedCallback): void {
    this.unauthorizedCallback = cb;
  }

  onRefreshToken(cb: RefreshTokenCallback): void {
    this.refreshTokenCallback = cb;
  }

  setSessionToken(token: string) {
    this.sessionToken = token;
  }

  clearSessionToken() {
    this.sessionToken = null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'apikey': this.anonKey,
      'Content-Type': 'application/json',
    };

    // Use JWT token in Authorization header (not x-session-token)
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    } else {
      // Fallback to anon key if no session
      headers['Authorization'] = `Bearer ${this.anonKey}`;
    }

    return headers;
  }

  private async attemptRefresh(): Promise<string> {
    // Deduplicate: if a refresh is already in flight, reuse it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshTokenCallback) {
      throw new Error('No refresh token callback registered');
    }

    this.refreshPromise = this.refreshTokenCallback().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      hasSessionToken: !!this.sessionToken,
      sessionTokenPreview: this.sessionToken ? this.sessionToken.substring(0, 20) + '...' : 'none',
      headers: {
        Authorization: headers['Authorization'],
        apikey: headers['apikey']?.substring(0, 20) + '...',
      }
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error: ApiErrorResponse;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'An unknown error occurred' };
      }

      // Handle 401 responses
      if (response.status === 401) {
        const errorCode = error.error_code;

        // TOKEN_EXPIRED: attempt refresh + retry (once)
        if (errorCode === 'TOKEN_EXPIRED' && !isRetry && this.refreshTokenCallback) {
          try {
            const newToken = await this.attemptRefresh();
            this.setSessionToken(newToken);
            return this.request<T>(endpoint, options, true);
          } catch {
            // Refresh failed — fall through to sign out
            this.unauthorizedCallback?.();
            throw new Error(error.error || error.message || 'Session expired');
          }
        }

        // TOKEN_INVALID, TOKEN_MISSING, UNAUTHORIZED, or retry already failed
        this.unauthorizedCallback?.();
        throw new Error(error.error || error.message || 'Unauthorized');
      }

      console.error('API Error:', {
        status: response.status,
        error,
        errorText,
      });
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async checkSession(): Promise<{valid: boolean; expires_in?: number}> {
    return this.request<{valid: boolean; expires_in?: number}>(API_ENDPOINTS.checkSession);
  }

  // Task operations
  async createTask(data: CreateTaskRequest): Promise<CreateTaskResponse> {
    return this.request<CreateTaskResponse>(API_ENDPOINTS.createTask, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTasks(params?: GetTasksParams): Promise<GetTasksResponse> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    const endpoint = query ? `${API_ENDPOINTS.getTasks}?${query}` : API_ENDPOINTS.getTasks;

    return this.request<GetTasksResponse>(endpoint);
  }

  async updateTask(
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<UpdateTaskResponse> {
    return this.request<UpdateTaskResponse>(API_ENDPOINTS.updateTask(taskId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(taskId: string): Promise<{success: boolean}> {
    // Soft delete by updating status to 'deleted'
    await this.request<UpdateTaskResponse>(API_ENDPOINTS.updateTask(taskId), {
      method: 'PUT',
      body: JSON.stringify({status: 'deleted'}),
    });
    return {success: true};
  }

  async duplicateTask(taskId: string): Promise<CreateTaskResponse> {
    return this.request<CreateTaskResponse>(API_ENDPOINTS.duplicateTask(taskId), {
      method: 'POST',
    });
  }

  // Step operations
  async getTaskSteps(
    taskId: string,
    params?: GetTaskStepsParams
  ): Promise<GetTaskStepsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.include_metadata !== undefined) {
      queryParams.append('include_metadata', params.include_metadata.toString());
    }

    const query = queryParams.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.getTaskSteps(taskId)}?${query}`
      : API_ENDPOINTS.getTaskSteps(taskId);

    return this.request<GetTaskStepsResponse>(endpoint);
  }

  async updateStep(
    stepId: string,
    data: UpdateStepRequest
  ): Promise<UpdateStepResponse> {
    return this.request<UpdateStepResponse>(API_ENDPOINTS.updateStep(stepId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addStep(data: AddStepRequest): Promise<AddStepResponse> {
    return this.request<AddStepResponse>(API_ENDPOINTS.addStep, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async splitStep(
    stepId: string,
    data?: SplitStepRequest
  ): Promise<SplitStepResponse> {
    return this.request<SplitStepResponse>(API_ENDPOINTS.splitStep(stepId), {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async rewriteStep(data: RewriteStepRequest): Promise<RewriteStepResponse> {
    return this.request<RewriteStepResponse>(API_ENDPOINTS.rewriteStep, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rewriteTask(data: RewriteTaskRequest): Promise<RewriteTaskResponse> {
    return this.request<RewriteTaskResponse>(API_ENDPOINTS.rewriteTask, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Queue operations
  async getQueueStatus(queueId: string): Promise<QueueStatus> {
    return this.request<QueueStatus>(API_ENDPOINTS.getQueueStatus(queueId));
  }

  async pollQueueStatus(
    queueId: string,
    intervalMs: number = 2000
  ): Promise<QueueStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getQueueStatus(queueId);

          if (status.status === 'complete') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error(status.error_message || 'Request failed'));
          } else {
            // Continue polling
            setTimeout(poll, intervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  async pollEnrichmentStatus(
    queueId: string,
    onComplete?: (result: QueueStatus['result']) => void,
    onError?: (error: string) => void
  ): Promise<QueueStatus> {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts++;

        try {
          const status = await this.getQueueStatus(queueId);

          if (status.status === 'complete') {
            clearInterval(interval);
            if (onComplete) onComplete(status.result);
            resolve(status);
          } else if (status.status === 'failed') {
            clearInterval(interval);
            const errorMsg = status.error_message || 'Enrichment failed';
            if (onError) onError(errorMsg);
            reject(new Error(errorMsg));
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            const timeoutMsg = 'Enrichment timeout - may still be processing';
            console.warn(timeoutMsg);
            if (onError) onError(timeoutMsg);
            reject(new Error(timeoutMsg));
          }
        } catch (error) {
          console.error('Error polling enrichment status:', error);
          clearInterval(interval);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          if (onError) onError(errorMsg);
          reject(error);
        }
      }, 1000); // Poll every second
    });
  }

  // Step note operations
  async updateStepNote(
    stepId: string,
    note: string
  ): Promise<{success: boolean; message: string}> {
    return this.request<{success: boolean; message: string}>(
      API_ENDPOINTS.updateStepNote(stepId),
      {
        method: 'PUT',
        body: JSON.stringify({note}),
      }
    );
  }

  async deleteStepNote(stepId: string): Promise<{success: boolean; message: string}> {
    return this.request<{success: boolean; message: string}>(
      API_ENDPOINTS.updateStepNote(stepId),
      {
        method: 'DELETE',
      }
    );
  }

  // Summary operations
  async getTasksSummary(params?: GetTasksSummaryParams): Promise<GetTasksSummaryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);

    const query = queryParams.toString();
    const endpoint = query ? `${API_ENDPOINTS.getTasksSummary}?${query}` : API_ENDPOINTS.getTasksSummary;

    return this.request<GetTasksSummaryResponse>(endpoint);
  }

  // User Preferences
  async getPreferences(): Promise<GetPreferencesResponse> {
    return this.request<GetPreferencesResponse>(API_ENDPOINTS.updatePreferences);
  }

  async updatePreferences(data: UpdatePreferencesRequest): Promise<GetPreferencesResponse> {
    return this.request<GetPreferencesResponse>(API_ENDPOINTS.updatePreferences, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
