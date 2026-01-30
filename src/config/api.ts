export const API_CONFIG = {
  baseUrl: 'https://lorriepsrynzoakzmlie.supabase.co/functions/v1',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcnJpZXBzcnluem9ha3ptbGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNzA4NDgsImV4cCI6MjA3Mjk0Njg0OH0.SiJlrtv3tEfFRp6Rd1ypax91goV16f5WurC-U7W5fPo',
};

export const API_ENDPOINTS = {
  createTask: '/create-task',
  getTasks: '/get-tasks',
  updateTask: (taskId: string) => `/update-task/${taskId}`,
  deleteTask: (taskId: string) => `/delete-task/${taskId}`,
  duplicateTask: (taskId: string) => `/duplicate-task/${taskId}`,
  getTaskSteps: (taskId: string) => `/get-task-steps/${taskId}`,
  updateStep: (stepId: string) => `/update-step/${stepId}`,
  addStep: '/add-step',
  splitStep: (stepId: string) => `/split-step/${stepId}`,
  rewriteStep: '/rewrite-step',
  rewriteTask: '/rewrite-task',
  getQueueStatus: (queueId: string) => `/get-queue-status/${queueId}`,
  getTasksSummary: '/get-tasks-summary',
  updateStepNote: (stepId: string) => `/update-step-note/${stepId}`,
  updatePreferences: '/update-preferences',
} as const;
