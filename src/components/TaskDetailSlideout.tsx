import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Alert, Animated, TouchableOpacity} from 'react-native';
import {ArrowRight, CircleCheckBig, MoreHorizontal, Copy, Edit, Trash2, Maximize2} from 'lucide-react-native';
import {PageHeader} from './PageHeader';
import {Button} from './Button';
import {Dropdown, DropdownItem} from './Dropdown';
import {ConfirmationModal} from './ConfirmationModal';
import {Step} from './Step';
import {colors, typography} from '../theme/tokens';
import {apiClient} from '../services/apiClient';
import {useAuth} from '../contexts/AuthContext';
import {useTasks} from '../contexts/TasksContext';
import type {Task, StepWithMetadata} from '../types/backend';

interface TaskDetailSlideoutProps {
  visible: boolean;
  taskId: string | null;
  onClose: () => void;
  onOpenFullView?: (taskId: string, taskTitle: string) => void;
}

export const TaskDetailSlideout: React.FC<TaskDetailSlideoutProps> = ({
  visible,
  taskId,
  onClose,
  onOpenFullView,
}) => {
  const {session} = useAuth();
  const {refreshTasks} = useTasks();
  const [task, setTask] = useState<Task | null>(null);
  const [steps, setSteps] = useState<StepWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSplitting, setIsSplitting] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isArrowHovered, setIsArrowHovered] = useState(false);
  const [isExpandHovered, setIsExpandHovered] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(1000)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(1000);
    }
  }, [visible, slideAnim]);

  useEffect(() => {
    if (taskId && session?.userId) {
      loadTaskDetails(taskId);
    }
  }, [taskId, session?.userId]);

  const loadTaskDetails = async (id: string) => {
    if (!session?.userId) {
      Alert.alert('Error', 'Please sign in to view task details');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const tasksResponse = await apiClient.getTasks({user_id: session.userId});
      const currentTask = tasksResponse.tasks.find(t => t.id === id);

      if (!currentTask) {
        Alert.alert('Error', 'Task not found');
        setIsLoading(false);
        return;
      }

      const stepsResponse = await apiClient.getTaskSteps(currentTask.id, {include_metadata: true});
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
    const newState = !currentState;

    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {...step, is_completed: newState}
          : step
      )
    );

    try {
      await apiClient.updateStep(stepId, {
        is_completed: newState,
      });

      if (taskId) {
        const tasksResponse = await apiClient.getTasks({user_id: session?.userId});
        const updatedTask = tasksResponse.tasks.find(t => t.id === taskId);
        if (updatedTask) {
          setTask(updatedTask);
        }
      }

      refreshTasks();
    } catch (error) {
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId
            ? {...step, is_completed: currentState}
            : step
        )
      );

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
      await apiClient.pollQueueStatus(response.queue_id);

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

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 1000,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleOpenFullView = () => {
    if (task && onOpenFullView) {
      handleClose();
      // Wait for animation to complete before navigating
      setTimeout(() => {
        onOpenFullView(task.id, task.title);
      }, 250);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setShowDeleteModal(false);

    try {
      await apiClient.deleteTask(task.id);
      await refreshTasks();
      handleClose();
    } catch (error) {
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
      onPress: () => {
        setShowDropdown(false);
        // TODO: Implement duplicate
      },
    },
    {
      label: 'Rewrite Task',
      icon: Edit,
      onPress: () => {
        setShowDropdown(false);
        // TODO: Implement rewrite
      },
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{translateX: slideAnim}],
            },
          ]}
          onStartShouldSetResponder={() => true}>
          <PageHeader
            title=""
            showBorderOnScroll={true}
            leftAction={
              <View style={styles.leftActions}>
                <TouchableOpacity
                  onPress={handleClose}
                  onMouseEnter={() => setIsArrowHovered(true)}
                  onMouseLeave={() => setIsArrowHovered(false)}
                  style={[styles.iconButton, isArrowHovered && styles.iconButtonHover]}
                >
                  <ArrowRight size={18} color={colors.gray.light[700]} strokeWidth={1.5} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleOpenFullView}
                  onMouseEnter={() => setIsExpandHovered(true)}
                  onMouseLeave={() => setIsExpandHovered(false)}
                  style={[styles.iconButton, isExpandHovered && styles.iconButtonHover]}
                >
                  <Maximize2 size={18} color={colors.gray.light[700]} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            }
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
            message={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            variant="destructive"
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
          />

          <ScrollView style={styles.bodyContainer}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task?.title || 'Loading...'}</Text>
              {!isLoading && (
                <Text style={styles.subtitle}>
                  {completedCount} of {totalCount} steps complete
                </Text>
              )}
            </View>
            <View style={styles.content}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.green[600]} />
              </View>
            ) : steps.length === 0 ? (
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
                  metadata={step.metadata}
                  onToggle={() => handleToggleStep(step.id, step.is_completed)}
                  onSplit={() => handleSplitStep(step.id)}
                  onRewrite={() => {}}
                  onAddAfter={() => {}}
                  isSplitting={isSplitting === step.id}
                  isRewriting={isRewriting === step.id}
                  isAddingAfter={false}
                />
              ))
            )}
            </View>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  container: {
    width: '50%',
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: -4, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
  },
  iconButtonHover: {
    backgroundColor: colors.gray.light[200],
  },
  bodyContainer: {
    flex: 1,
    paddingHorizontal: 64,
    paddingBottom: 32,
  },
  taskHeader: {
    paddingTop: 52,
    paddingBottom: 20,
    gap: 8,
  },
  taskTitle: {
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray.light[500],
    fontSize: typography.body.medium.fontSize,
    fontFamily: typography.body.medium.fontFamily,
    paddingTop: 20,
  },
});
