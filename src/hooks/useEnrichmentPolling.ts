import {useState, useCallback, useRef, useEffect} from 'react';
import {apiClient} from '../services/apiClient';
import type {StepWithMetadata, QueueStatus} from '../types/backend';

interface UseEnrichmentPollingOptions {
  taskId: string | null;
  onStepsRefresh: (steps: StepWithMetadata[]) => void;
  pollingInterval?: number; // Default: 2000ms
  maxPolls?: number; // Default: 150 (5 min timeout at 2s intervals)
}

interface EnrichmentResult {
  enriched_steps?: number;
  total_links_added?: number;
  drafts_created?: number;
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
        console.warn('[useEnrichmentPolling] Timeout - max polls reached');
        stopPolling();
        return;
      }
      pollCountRef.current++;
      console.log(`[useEnrichmentPolling] Poll #${pollCountRef.current} for queue:`, queueId);

      try {
        // 1. Check enrichment status
        const status = await apiClient.getQueueStatus(queueId);
        console.log('[useEnrichmentPolling] Queue status:', status.status);

        // 2. Refresh steps to get latest metadata (use refs to avoid stale closures)
        const currentTaskId = taskIdRef.current;
        if (currentTaskId) {
          const stepsResponse = await apiClient.getTaskSteps(currentTaskId, {
            include_metadata: true,
          });
          console.log('[useEnrichmentPolling] Refreshing steps:', stepsResponse.steps.length);
          // Log the actual metadata from the API response
          if (stepsResponse.steps[0]) {
            console.log('[useEnrichmentPolling] API response - first step metadata:',
              JSON.stringify(stepsResponse.steps[0].metadata));
          }
          onStepsRefreshRef.current(stepsResponse.steps);
        }

        // 3. Check if complete
        if (status.status === 'complete') {
          stopPolling();

          // Log success info
          const result = status.result as EnrichmentResult | null;
          const totalLinksAdded = result?.total_links_added || 0;
          const draftsCreated = result?.drafts_created || 0;
          if (totalLinksAdded > 0 || draftsCreated > 0) {
            console.log(
              `Enrichment complete: ${totalLinksAdded} links, ${draftsCreated} drafts added`
            );
          }
          return;
        }

        if (status.status === 'failed') {
          stopPolling();
          console.error('Enrichment failed:', status.error_message);
          return;
        }

        // 4. Schedule next poll
        timeoutRef.current = setTimeout(() => poll(queueId), pollingInterval);
      } catch (error) {
        console.error('Enrichment polling error:', error);
        // Continue polling on network errors (may be transient)
        timeoutRef.current = setTimeout(() => poll(queueId), pollingInterval);
      }
    },
    [pollingInterval, maxPolls, stopPolling]
  );

  const startPolling = useCallback(
    (queueId: string) => {
      console.log('[useEnrichmentPolling] Starting polling for queue:', queueId);
      console.log('[useEnrichmentPolling] taskId:', taskIdRef.current);

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
