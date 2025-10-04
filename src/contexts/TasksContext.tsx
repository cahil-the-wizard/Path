import React, {createContext, useContext, useState, useCallback, ReactNode} from 'react';
import {apiClient} from '../services/apiClient';
import type {Task, TaskSummary} from '../types/backend';

interface TasksContextValue {
  tasks: Task[];
  tasksSummary: TaskSummary[];
  isLoading: boolean;
  refreshTasks: () => Promise<void>;
  refreshTasksSummary: () => Promise<void>;
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export const TasksProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksSummary, setTasksSummary] = useState<TaskSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getTasks({status: 'active', limit: 10});
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshTasksSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getTasksSummary();
      setTasksSummary(response.tasks);
    } catch (error) {
      console.error('Failed to refresh tasks summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
