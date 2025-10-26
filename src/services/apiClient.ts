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
  GetTasksSummaryResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateStepRequest,
  AddStepRequest,
  SplitStepRequest,
  GetTasksParams,
  GetTaskStepsParams,
  GetTasksSummaryParams,
} from '../types/backend';

class ApiClient {
  private baseUrl: string;
  private anonKey: string;
  private sessionToken: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.anonKey = API_CONFIG.anonKey;
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
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
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'An unknown error occurred' };
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
    return this.request<{success: boolean}>(API_ENDPOINTS.deleteTask(taskId), {
      method: 'DELETE',
    });
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

  // Summary operations
  async getTasksSummary(params?: GetTasksSummaryParams): Promise<GetTasksSummaryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);

    const query = queryParams.toString();
    const endpoint = query ? `${API_ENDPOINTS.getTasksSummary}?${query}` : API_ENDPOINTS.getTasksSummary;

    return this.request<GetTasksSummaryResponse>(endpoint);
  }
}

export const apiClient = new ApiClient();
