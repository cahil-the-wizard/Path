import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {Step} from '../components/Step';
import {CircleCheckBig} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {apiClient} from '../services/apiClient';
import {useLocation} from 'react-router-dom';
import type {Task, StepWithMetadata} from '../types/backend';

export const TaskDetail: React.FC = () => {
  const location = useLocation();
  const [task, setTask] = useState<Task | null>(null);
  const [steps, setSteps] = useState<StepWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSplitting, setIsSplitting] = useState<string | null>(null);

  // Get task ID from URL query params
  const searchParams = new URLSearchParams(location.search);
  const taskId = searchParams.get('id');

  useEffect(() => {
    if (taskId) {
      loadTaskDetails(taskId);
    } else {
      setIsLoading(false);
    }
  }, [taskId]);

  const loadTaskDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const [tasksResponse, stepsResponse] = await Promise.all([
        apiClient.getTasks(),
        apiClient.getTaskSteps(id),
      ]);

      const currentTask = tasksResponse.tasks.find(t => t.id === id);
      if (currentTask) {
        setTask(currentTask);
      }
      setSteps(stepsResponse.steps);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load task details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStep = async (stepId: string, currentState: boolean) => {
    try {
      await apiClient.updateStep(stepId, {
        is_completed: !currentState,
      });

      // Update local state
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? {...step, is_completed: !currentState}
            : step
        )
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update step'
      );
    }
  };

  const handleSplitStep = async (stepId: string) => {
    try {
      setIsSplitting(stepId);
      const response = await apiClient.splitStep(stepId);

      // Poll for completion
      await apiClient.pollQueueStatus(response.queue_id);

      // Reload steps after split
      if (taskId) {
        const stepsResponse = await apiClient.getTaskSteps(taskId);
        setSteps(stepsResponse.steps);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to split step'
      );
    } finally {
      setIsSplitting(null);
    }
  };

  const completedCount = steps.filter(s => s.is_completed).length;
  const totalCount = steps.length;

  if (!taskId) {
    return (
      <View style={styles.container}>
        <PageHeader title="Task Detail" icon={CircleCheckBig} />
        <View style={styles.content}>
          <View style={styles.centeredContent}>
            <Text style={styles.errorText}>No task selected</Text>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Loading..." icon={CircleCheckBig} />
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.indigo[600]} />
          </View>
        </View>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <PageHeader title="Task Detail" icon={CircleCheckBig} />
        <View style={styles.content}>
          <View style={styles.centeredContent}>
            <Text style={styles.errorText}>Task not found</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title={task.title} icon={CircleCheckBig} showBorderOnScroll={true} />
      <View style={styles.content}>
        <View style={styles.centeredContent}>
          <View style={styles.body}>
            <View style={styles.header}>
              <Text style={styles.title}>{task.title}</Text>
              <Text style={styles.subtitle}>
                {completedCount} of {totalCount} steps complete
              </Text>
            </View>
            <ScrollView style={styles.stepsList}>
              {steps.length === 0 ? (
                <Text style={styles.emptyText}>No steps yet</Text>
              ) : (
                steps.map(step => (
                  <Step
                    key={step.id}
                    title={step.title}
                    description={step.description}
                    completed={step.is_completed}
                    onToggle={() => handleToggleStep(step.id, step.is_completed)}
                    onSplit={
                      !step.is_completed && isSplitting !== step.id
                        ? () => handleSplitStep(step.id)
                        : undefined
                    }
                    isSplitting={isSplitting === step.id}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
  },
  body: {
    maxWidth: 600,
    width: '100%',
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 20,
    gap: 8,
  },
  title: {
    color: colors.gray.light[950],
    fontSize: typography.heading.heading.fontSize,
    fontFamily: typography.heading.heading.fontFamily,
    fontWeight: String(typography.heading.heading.fontWeight) as any,
    lineHeight: typography.heading.heading.lineHeight,
  },
  subtitle: {
    color: colors.gray.light[600],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: String(typography.body.base.fontWeight) as any,
    lineHeight: typography.body.base.lineHeight,
  },
  stepsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.gray.light[500],
    fontSize: typography.body.medium.fontSize,
    fontFamily: typography.body.medium.fontFamily,
  },
  emptyText: {
    color: colors.gray.light[500],
    fontSize: typography.body.medium.fontSize,
    fontFamily: typography.body.medium.fontFamily,
    paddingTop: 20,
  },
});
