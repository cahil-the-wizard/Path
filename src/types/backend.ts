// Backend data models
export type TaskStatus = 'active' | 'completed' | 'archived' | 'deleted';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  rank_order: number;
  due_date: string | null; // Format: YYYY-MM-DD
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Step {
  id: string;
  task_id: string;
  title: string;
  description: string;
  time_estimate: string;
  completion_cue: string;
  is_completed: boolean;
  rank_order: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface HelpfulLink {
  url: string;
  title: string;
  relevance_reason: string;
  source: 'ai_recommendation' | 'web_search';
}

export interface HelpfulLinksMetadata {
  enriched_at: string;
  links: HelpfulLink[];
}

export interface StepMetadata {
  id: string;
  step_id: string;
  field: 'helpful_links';
  value: HelpfulLinksMetadata;
  created_at: string;
}

export interface StepWithMetadata extends Step {
  metadata?: StepMetadata[];
}

export interface QueueStatus {
  queue_id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  request_type: 'new_task' | 'new_step' | 'split_step';
  result: {
    task_id?: string;
    step_count?: number;
    step_id?: string;
    new_step_count?: number;
  } | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface TaskSummary {
  id: string;
  title: string;
  due_date: string | null;
  next_step: {
    id: string;
    title: string;
    description: string;
    time_estimate: string;
  } | null;
}

// API Response types
export interface GetTasksResponse {
  tasks: Task[];
}

export interface GetTaskStepsResponse {
  task_id: string;
  steps: StepWithMetadata[];
}

export interface CreateTaskResponse {
  queue_id: string;
  status: 'pending';
  message: string;
}

export interface UpdateTaskResponse {
  task: Task;
}

export interface UpdateStepResponse {
  step: Step;
  enrichment_queue_id?: string | null;
}

export interface AddStepResponse {
  queue_id: string;
  status: 'pending';
  message: string;
}

export interface SplitStepResponse {
  queue_id: string;
  status: 'pending';
  message: string;
}

export interface RewriteStepResponse {
  queue_id: string;
  status: 'pending';
  message: string;
}

export interface RewriteTaskResponse {
  queue_id: string;
  status: 'pending';
  message: string;
}

export interface GetTasksSummaryResponse {
  tasks: TaskSummary[];
}

// API Request types
export interface CreateTaskRequest {
  prompt: string;
}

export interface UpdateTaskRequest {
  status?: TaskStatus;
  rank_order?: number;
  due_date?: string | null;
  title?: string;
}

export interface UpdateStepRequest {
  is_completed?: boolean;
  rank_order?: number;
}

export interface AddStepRequest {
  task_id: string;
  prompt: string;
  insert_after_step_id?: string;
  insert_before_step_id?: string;
}

export interface SplitStepRequest {
  additional_context?: string;
}

export interface RewriteStepRequest {
  step_id: string;
  prompt: string;
}

export interface RewriteTaskRequest {
  task_id: string;
  prompt: string;
}

export interface GetTasksParams {
  user_id?: string;
  status?: TaskStatus;
  limit?: number;
  offset?: number;
}

export interface GetTaskStepsParams {
  include_metadata?: boolean;
}

export interface GetTasksSummaryParams {
  user_id?: string;
}
