import React, {createContext, useContext, useState, useCallback, ReactNode} from 'react';
import {apiClient} from '../services/apiClient';
import type {Task, TaskSummary} from '../types/backend';
import {useAuth} from './AuthContext';

const TASKS_PER_PAGE = 10;

interface TasksContextValue {
  tasks: Task[];
  tasksSummary: TaskSummary[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreTasks: boolean;
  totalTasks: number;
  refreshTasks: () => Promise<void>;
  loadMoreTasks: () => Promise<void>;
  refreshTasksSummary: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export const TasksProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const {session} = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksSummary, setTasksSummary] = useState<TaskSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);

  const hasMoreTasks = tasks.length < totalTasks;

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
        limit: TASKS_PER_PAGE,
        offset: 0
      });
      // Sort by most recent first
      const sortedTasks = response.tasks.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTasks(sortedTasks);
      setTotalTasks(response.total || 0);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.userId]);

  const loadMoreTasks = useCallback(async () => {
    if (!session?.userId || isLoadingMore || !hasMoreTasks) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const response = await apiClient.getTasks({
        user_id: session.userId,
        status: 'active',
        limit: TASKS_PER_PAGE,
        offset: tasks.length
      });
      // Sort new tasks by most recent first
      const sortedNewTasks = response.tasks.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTasks(prev => [...prev, ...sortedNewTasks]);
      setTotalTasks(response.total || 0);
    } catch (error) {
      console.error('Failed to load more tasks:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [session?.userId, isLoadingMore, hasMoreTasks, tasks.length]);

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
        isLoadingMore,
        hasMoreTasks,
        totalTasks,
        refreshTasks,
        loadMoreTasks,
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
