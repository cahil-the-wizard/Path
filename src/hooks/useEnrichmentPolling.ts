import {useState, useCallback, useRef, useEffect} from 'react';
import {apiClient} from '../services/apiClient';
import type {StepWithMetadata} from '../types/backend';

interface UseEnrichmentPollingOptions {
  taskId: string | null;
  onStepsRefresh: (steps: StepWithMetadata[]) => void;
  pollingInterval?: number; // Default: 2000ms
  maxPolls?: number; // Default: 150 (5 min timeout at 2s intervals)
}

export function useEnrichmentPolling({
  taskId,
  onStepsRefresh,
  pollingInterval = 2000,
  maxPolls = 150,
}: UseEnrichmentPollingOptions) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [currentQueueId, setCurrentQueueId] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to avoid stale closures in setTimeout
  const taskIdRef = useRef(taskId);
  const onStepsRefreshRef = useRef(onStepsRefresh);

  // Keep refs up to date
  useEffect(() => {
    taskIdRef.current = taskId;
  }, [taskId]);

  useEffect(() => {
    onStepsRefreshRef.current = onStepsRefresh;
  }, [onStepsRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsEnriching(false);
    setCurrentQueueId(null);
    pollCountRef.current = 0;
  }, []);

  const poll = useCallback(
    async (queueId: string) => {
      // Check max polls
      if (pollCountRef.current >= maxPolls) {
        stopPolling();
        return;
      }
      pollCountRef.current++;

      try {
        // 1. Check enrichment status
        const status = await apiClient.getQueueStatus(queueId);

        // 2. Refresh steps to get latest metadata (use refs to avoid stale closures)
        const currentTaskId = taskIdRef.current;
        if (currentTaskId) {
          const stepsResponse = await apiClient.getTaskSteps(currentTaskId, {
            include_metadata: true,
          });
          onStepsRefreshRef.current(stepsResponse.steps);
        }

        // 3. Check if complete
        if (status.status === 'complete' || status.status === 'failed') {
          stopPolling();
          return;
        }

        // 4. Schedule next poll
        timeoutRef.current = setTimeout(() => poll(queueId), pollingInterval);
      } catch {
        // Continue polling on network errors (may be transient)
        timeoutRef.current = setTimeout(() => poll(queueId), pollingInterval);
      }
    },
    [pollingInterval, maxPolls, stopPolling]
  );

  const startPolling = useCallback(
    (queueId: string) => {
      // Cancel any existing polling
      stopPolling();

      // Start new polling session
      setIsEnriching(true);
      setCurrentQueueId(queueId);
      pollCountRef.current = 0;

      // Start immediately
      poll(queueId);
    },
    [poll, stopPolling]
  );

  return {
    isEnriching,
    currentQueueId,
    startPolling,
    stopPolling,
  };
}
