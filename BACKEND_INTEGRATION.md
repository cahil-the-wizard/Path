# Backend Integration Summary

Complete integration of the Path backend with the React Native web app.

## Core Infrastructure

### TypeScript Types
**File:** `src/types/backend.ts`

Complete TypeScript types for all backend models:
- `Task` - Main task model with status, rank_order, due_date
- `Step` - Step model with completion tracking
- `QueueStatus` - Async operation status tracking
- `TaskSummary` - Summary view for Today page
- All API request/response types

### API Configuration
**File:** `src/config/api.ts`

Backend configuration:
- Base URL: `https://lorriepsrynzoakzmlie.supabase.co/functions/v1`
- Anon key stored as constant
- All 9 endpoint paths defined

### API Client
**File:** `src/services/apiClient.ts`

Full-featured API client with:
- Automatic header management:
  - `Authorization: Bearer {anonKey}`
  - `apikey: {anonKey}`
  - `x-session-token: {userSessionToken}`
  - `Content-Type: application/json`
- All endpoint methods:
  - `createTask(data)` - Create new task (async)
  - `getTasks(params?)` - Get user's tasks with filters
  - `updateTask(taskId, data)` - Update task properties
  - `getTaskSteps(taskId, params?)` - Get all steps for a task
  - `updateStep(stepId, data)` - Update step completion/rank
  - `addStep(data)` - Add new step to task (async)
  - `splitStep(stepId, data?)` - Break step into sub-steps (async)
  - `getQueueStatus(queueId)` - Check async operation status
  - `pollQueueStatus(queueId, intervalMs?)` - Auto-poll until complete
  - `getTasksSummary()` - Get top 3 prioritized tasks
- Built-in error handling
- Session token management

### Auth Service
**File:** `src/services/auth.ts`

Authentication service with:
- Session management:
  - `setSession(session)` - Store session and update API client
  - `getSession()` - Get current session
  - `signOut()` - Clear session
  - `isAuthenticated()` - Check auth status
- Session persistence via localStorage
- `restoreSession()` - Restore session on app init
- Placeholder methods for signUp/signIn (need implementation)

## Component Integration

### NewTask Page
**File:** `src/pages/NewTask.tsx`
**Lines:** 16-50 (handleCreateTask function)

Integrated task creation flow:
1. User enters task description
2. Click arrow button triggers `handleCreateTask()`
3. Calls `apiClient.createTask({ prompt })`
4. Polls `pollQueueStatus()` until task creation completes
5. Shows ActivityIndicator during processing
6. Displays success/error alerts
7. Navigates to Today page on success
8. Clears input field

### Today Page
**File:** `src/pages/Today.tsx`
**Lines:** 14-26 (loadTasks function)

Integrated task display:
1. Calls `apiClient.getTasksSummary()` on mount
2. Loads top 3 prioritized tasks from backend
3. Shows loading spinner while fetching
4. Displays empty state when no tasks exist
5. Maps backend data to TodayCard components:
   - Task title → taskName
   - Next step title → stepTitle
   - Time estimate → chipLabel

## Next Steps

### 1. Implement Authentication Endpoints
Update `src/services/auth.ts` with actual signup/signin:

```typescript
async signUp(credentials: SignUpCredentials): Promise<AuthSession> {
  // Call your backend's signup endpoint
  // Return session with sessionToken, userId, expiresAt
}

async signIn(credentials: SignInCredentials): Promise<AuthSession> {
  // Call your backend's signin endpoint
  // Return session with sessionToken, userId, expiresAt
}
```

### 2. Add Authentication Flow
- Create login/signup screen components
- Add route guards for protected pages
- Redirect to login if not authenticated

### 3. Initialize Session on App Start
In `App.tsx`, restore session:

```typescript
useEffect(() => {
  authService.restoreSession();
}, []);
```

### 4. Get Real Session Token
After successful authentication:
```typescript
const session = await authService.signIn({ email, password });
authService.setSession(session);
// Now all API calls will include the session token
```

### 5. Complete TaskDetail Page
Update `src/pages/TaskDetail.tsx` to:
- Load task and steps from backend
- Handle step completion toggling
- Support drag-and-drop reordering
- Call addStep/splitStep endpoints

## API Usage Examples

### Creating a Task
```typescript
// Trigger task creation
const response = await apiClient.createTask({
  prompt: 'Plan a weekend hiking trip'
});

// Poll until complete
const status = await apiClient.pollQueueStatus(response.queue_id);
const taskId = status.result.task_id;
```

### Loading Tasks
```typescript
// Get all active tasks
const { tasks } = await apiClient.getTasks({
  status: 'active',
  limit: 10
});

// Get top 3 for Today view
const { tasks } = await apiClient.getTasksSummary();
```

### Updating a Step
```typescript
// Mark step as completed
await apiClient.updateStep(stepId, {
  is_completed: true
});

// Reorder step
await apiClient.updateStep(stepId, {
  rank_order: 1.5
});
```

### Adding a Step
```typescript
const response = await apiClient.addStep({
  task_id: taskId,
  prompt: 'Check weather forecast',
  insert_after_step_id: existingStepId // optional
});

const status = await apiClient.pollQueueStatus(response.queue_id);
const newStepId = status.result.step_id;
```

## Important Notes

- **Session Token**: Must be obtained from your backend's auth system after login
- **Async Operations**: createTask, addStep, splitStep all require polling
- **Polling Interval**: Default 2 seconds, adjust as needed
- **Error Handling**: All API methods throw errors that should be caught
- **RLS Security**: Backend enforces row-level security - users only see their own data

## Backend Reference

Full backend documentation: `/Users/cahil/Downloads/PATH_BACKEND_INTEGRATION_GUIDE_V2.md`

Base URL: `https://lorriepsrynzoakzmlie.supabase.co/functions/v1`
