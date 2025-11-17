import React, {createContext, useContext, useState, useCallback, ReactNode} from 'react';
import {apiClient} from '../services/apiClient';
import type {Task, TaskSummary} from '../types/backend';
import {useAuth} from './AuthContext';

interface TasksContextValue {
  tasks: Task[];
  tasksSummary: TaskSummary[];
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
  refreshTasksSummary: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export const TasksProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const {session} = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksSummary, setTasksSummary] = useState<TaskSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTasks = useCallback(async () => {
    if (!session?.userId) {
      console.warn('No user session available, skipping task refresh');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getTasks({
        user_id: session.userId,
        status: 'active',
        limit: 10
      });
      // Sort by most recent first
      const sortedTasks = response.tasks.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.userId]);

  const refreshTasksSummary = useCallback(async () => {
    if (!session?.userId) {
      console.warn('No user session available, skipping tasks summary refresh');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getTasksSummary({user_id: session.userId});
      setTasksSummary(response.tasks);
    } catch (error) {
      console.error('Failed to refresh tasks summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.userId]);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        tasksSummary,
        isLoading,
        refreshTasks,
        refreshTasksSummary,
      }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }
  return context;
};
