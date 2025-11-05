import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {Step} from '../components/Step';
import {Button} from '../components/Button';
import {Dropdown, DropdownItem} from '../components/Dropdown';
import {ConfirmationModal} from '../components/ConfirmationModal';
import {CircleCheckBig, MoreHorizontal, Copy, Edit, Trash2} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {apiClient} from '../services/apiClient';
import {useParams, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {useTasks} from '../contexts/TasksContext';
import type {Task, StepWithMetadata} from '../types/backend';
import {getTaskIdFromSlug, generateTaskSlug} from '../utils/slug';

export const TaskDetail: React.FC = () => {
  const {taskSlug} = useParams<{taskSlug: string}>();
  // Extract task ID prefix from the slug (last 8 chars)
  const taskIdPrefix = taskSlug ? getTaskIdFromSlug(taskSlug) : undefined;
  const {session} = useAuth();
  const navigate = useNavigate();
  const {refreshTasks, refreshTasksSummary} = useTasks();
  const [task, setTask] = useState<Task | null>(null);
  const [steps, setSteps] = useState<StepWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSplitting, setIsSplitting] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    console.log('TaskDetail useEffect:', { taskSlug, taskIdPrefix, session });
    if (taskIdPrefix && session?.userId) {
      loadTaskDetails(taskIdPrefix);
    } else if (taskIdPrefix && !session?.userId) {
      console.log('Waiting for session...');
      // Session not ready yet, keep loading state
    } else {
      setIsLoading(false);
    }
  }, [taskIdPrefix, session?.userId]);

  const loadTaskDetails = async (idPrefix: string) => {
    console.log('loadTaskDetails called with:', { idPrefix, userId: session?.userId });

    if (!session?.userId) {
      console.error('No session userId available');
      Alert.alert('Error', 'Please sign in to view task details');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // First, get all tasks to find the full ID
      console.log('Fetching tasks...');
      const tasksResponse = await apiClient.getTasks({user_id: session.userId});
      console.log('Tasks fetched:', tasksResponse.tasks.length, 'tasks');

      const currentTask = tasksResponse.tasks.find(t => t.id.startsWith(idPrefix));
      console.log('Looking for task with ID prefix:', idPrefix);
      console.log('Found task:', currentTask);

      if (!currentTask) {
        console.error('Task not found with prefix:', idPrefix);
        Alert.alert('Error', 'Task not found');
        setIsLoading(false);
        return;
      }

      // Now fetch steps using the full ID
      console.log('Fetching steps for task:', currentTask.id);
      const stepsResponse = await apiClient.getTaskSteps(currentTask.id, {include_metadata: true});
      console.log('Steps fetched:', stepsResponse.steps.length, 'steps');

      setTask(currentTask);
      setSteps(stepsResponse.steps);
    } catch (error) {
      console.error('Error loading task details:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load task details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStep = async (stepId: string, currentState: boolean) => {
    console.log('Toggle step clicked:', { stepId, currentState, newState: !currentState });
    try {
      await apiClient.updateStep(stepId, {
        is_completed: !currentState,
      });
      console.log('Step updated successfully in database');

      // Update local state
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? {...step, is_completed: !currentState}
            : step
        )
      );
      console.log('Local state updated');
    } catch (error) {
      console.error('Failed to update step:', error);
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
      if (task?.id) {
        const stepsResponse = await apiClient.getTaskSteps(task.id, {include_metadata: true});
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

  const handleDuplicate = async () => {
    if (!task) return;

    try {
      const response = await apiClient.duplicateTask(task.id);

      // Poll for completion
      const queueStatus = await apiClient.pollQueueStatus(response.queue_id);

      if (queueStatus.result?.task_id) {
        // Refresh task lists
        await Promise.all([refreshTasks(), refreshTasksSummary()]);

        // Navigate to the duplicated task
        const tasksResponse = await apiClient.getTasks({user_id: session?.userId});
        const duplicatedTask = tasksResponse.tasks.find(t => t.id === queueStatus.result.task_id);

        if (duplicatedTask) {
          const slug = generateTaskSlug(duplicatedTask.title, duplicatedTask.id);
          navigate(`/task/${slug}`);
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to duplicate task'
      );
    }
  };

  const handleEdit = () => {
    // Placeholder for edit functionality
    Alert.alert('Edit Task', 'Edit functionality coming soon');
  };

  const handleDelete = async () => {
    if (!task) return;

    console.log('handleDelete called for task:', task.id);
    setShowDeleteModal(false); // Close the modal first

    try {
      console.log('Calling deleteTask API...');
      await apiClient.deleteTask(task.id);
      console.log('Task deleted successfully');

      // Refresh task lists
      console.log('Refreshing task lists...');
      await Promise.all([refreshTasks(), refreshTasksSummary()]);

      // Navigate to new task page
      console.log('Navigating to new task page...');
      navigate('/new-task');
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to delete task'
      );
    }
  };

  const dropdownItems: DropdownItem[] = [
    {
      label: 'Duplicate',
      icon: Copy,
      onPress: handleDuplicate,
    },
    {
      label: 'Edit',
      icon: Edit,
      onPress: handleEdit,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onPress: () => setShowDeleteModal(true),
      variant: 'destructive',
    },
  ];

  const completedCount = steps.filter(s => s.is_completed).length;
  const totalCount = steps.length;

  if (!taskIdPrefix) {
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
      <PageHeader
        title={task.title}
        icon={CircleCheckBig}
        showBorderOnScroll={true}
        actions={
          <Button
            variant="ghost"
            size="small"
            label=""
            leftIcon={MoreHorizontal}
            onPress={() => setShowDropdown(!showDropdown)}
          />
        }
      />
      <Dropdown
        items={dropdownItems}
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        align="right"
      />
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
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
                    timeEstimate={step.time_estimate}
                    completionCue={step.completion_cue}
                    completed={step.is_completed}
                    onToggle={() => handleToggleStep(step.id, step.is_completed)}
                    onSplit={() => handleSplitStep(step.id)}
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
