import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TouchableOpacity, Alert} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {Dropdown, DropdownItem} from '../components/Dropdown';
import {ConfirmationModal} from '../components/ConfirmationModal';
import {RewriteTaskModal} from '../components/RewriteTaskModal';
import {CircleCheckBig, MoreHorizontal, Copy, Edit, Trash2} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {apiClient} from '../services/apiClient';
import {useAuth} from '../contexts/AuthContext';
import {useTasks} from '../contexts/TasksContext';
import {useNavigate} from 'react-router-dom';
import type {Task} from '../types/backend';
import {generateTaskSlug} from '../utils/slug';

type FilterType = 'active' | 'completed' | 'trash';

export const TasksList: React.FC = () => {
  const {session} = useAuth();
  const navigate = useNavigate();
  const {refreshTasks, refreshTasksSummary} = useTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({x: 0, y: 0});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRewriteTaskModal, setShowRewriteTaskModal] = useState(false);

  useEffect(() => {
    if (session?.userId) {
      loadTasks();
    }
  }, [session?.userId]);

  const loadTasks = async () => {
    if (!session?.userId) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getTasks({user_id: session.userId});
      console.log('loadTasks - Total tasks received:', response.tasks.length);
      console.log('loadTasks - Task statuses:', response.tasks.map(t => ({id: t.id, title: t.title, status: t.status})));
      setTasks(response.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskPress = (task: Task) => {
    const slug = generateTaskSlug(task.title, task.id);
    navigate(`/task/${slug}`);
  };

  const handleMorePress = (e: any, task: Task) => {
    e.stopPropagation();

    // Get the button position
    const rect = e.currentTarget.getBoundingClientRect();

    // Position dropdown below the button, aligned to the right
    setDropdownPosition({
      x: rect.right - 160, // Align right edge of dropdown with right edge of button (160px is dropdown width)
      y: rect.bottom + 4,
    });

    setSelectedTask(task);
    setShowDropdown(true);
  };

  const handleDuplicate = async () => {
    if (!selectedTask) return;

    try {
      setShowDropdown(false);
      const response = await apiClient.duplicateTask(selectedTask.id);

      // Poll for completion
      const queueStatus = await apiClient.pollQueueStatus(response.queue_id);

      if (queueStatus.result?.task_id) {
        // Refresh task lists
        await Promise.all([refreshTasks(), refreshTasksSummary()]);
        await loadTasks();

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

  const handleRewriteTaskClick = () => {
    setShowDropdown(false);
    setShowRewriteTaskModal(true);
  };

  const handleRewriteTask = async (prompt: string) => {
    if (!selectedTask) return;

    try {
      setShowRewriteTaskModal(false);
      const response = await apiClient.rewriteTask({
        task_id: selectedTask.id,
        prompt,
      });

      // Poll for completion
      await apiClient.pollQueueStatus(response.queue_id);

      // Reload tasks
      await loadTasks();

      // Refresh task lists
      await Promise.all([refreshTasks(), refreshTasksSummary()]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to rewrite task'
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedTask) return;

    const taskToDelete = selectedTask;
    console.log('handleDelete called for task:', taskToDelete.id);

    setShowDeleteModal(false);
    setShowDropdown(false);
    setSelectedTask(null);

    try {
      console.log('Calling deleteTask API...');
      await apiClient.deleteTask(taskToDelete.id);
      console.log('Task deleted successfully');

      // Update local state immediately to remove from active list
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskToDelete.id
            ? {...t, status: 'deleted' as const}
            : t
        )
      );

      // Refresh task lists in background
      console.log('Refreshing task lists...');
      await Promise.all([
        refreshTasks(),
        refreshTasksSummary(),
        loadTasks()
      ]);
      console.log('Task lists refreshed');
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
      label: 'Rewrite Task',
      icon: Edit,
      onPress: handleRewriteTaskClick,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onPress: () => {
        setShowDropdown(false);
        setShowDeleteModal(true);
      },
      variant: 'destructive',
    },
  ];

  const filteredTasks = tasks
    .filter(task => {
      if (activeFilter === 'active') return task.status === 'active';
      if (activeFilter === 'completed') return task.status === 'completed';
      if (activeFilter === 'trash') return task.status === 'deleted';
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Tasks" icon={CircleCheckBig} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green[600]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Tasks" icon={CircleCheckBig} showBorderOnScroll={true} />
      <Dropdown
        items={dropdownItems}
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        position={dropdownPosition}
      />
      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
      <RewriteTaskModal
        visible={showRewriteTaskModal}
        taskTitle={selectedTask?.title || ''}
        onConfirm={handleRewriteTask}
        onCancel={() => setShowRewriteTaskModal(false)}
      />
      <View style={styles.content}>
        <View style={styles.centeredContent}>
          <View style={styles.body}>
            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeFilter === 'active' && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter('active')}>
                <Text style={[
                  styles.filterTabText,
                  activeFilter === 'active' && styles.filterTabTextActive,
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeFilter === 'completed' && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter('completed')}>
                <Text style={[
                  styles.filterTabText,
                  activeFilter === 'completed' && styles.filterTabTextActive,
                ]}>
                  Completed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeFilter === 'trash' && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter('trash')}>
                <Text style={[
                  styles.filterTabText,
                  activeFilter === 'trash' && styles.filterTabTextActive,
                ]}>
                  Trash
                </Text>
              </TouchableOpacity>
            </View>

            {/* Task List */}
            <ScrollView style={styles.tasksList}>
              {filteredTasks.length === 0 ? (
                <Text style={styles.emptyText}>No tasks</Text>
              ) : (
                <View style={styles.tasksListContainer}>
                  {filteredTasks.map(task => (
                    <Pressable
                      key={task.id}
                      style={[
                        styles.taskItem,
                        hoveredTaskId === task.id && styles.taskItemHover,
                      ]}
                      onPress={() => handleTaskPress(task)}
                      onMouseEnter={() => setHoveredTaskId(task.id)}
                      onMouseLeave={() => setHoveredTaskId(null)}>
                      <View style={styles.taskContent}>
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text style={styles.taskDescription} numberOfLines={1}>
                            {task.description}
                          </Text>
                        )}
                      </View>
                      {hoveredTaskId === task.id ? (
                        <TouchableOpacity
                          style={styles.moreButton}
                          onPress={(e) => handleMorePress(e, task)}>
                          <MoreHorizontal size={18} color={colors.gray.light[700]} strokeWidth={1.5} />
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.dueDate}>
                          {new Date(task.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
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
    paddingTop: 24,
    gap: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  filterTab: {
    backgroundColor: colors.gray.light[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 38,
    // @ts-ignore - web-specific styles
    cursor: 'pointer',
  },
  filterTabActive: {
    backgroundColor: colors.green[500],
  },
  filterTabText: {
    color: colors.gray.light[950],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  filterTabTextActive: {
    color: 'white',
  },
  tasksList: {
    flex: 1,
  },
  tasksListContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray.light[200],
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light[200],
    // @ts-ignore - web-specific styles
    cursor: 'pointer',
    // @ts-ignore
    transition: 'background-color 0.15s ease',
  },
  taskItemHover: {
    backgroundColor: colors.gray.light[50],
  },
  taskContent: {
    flex: 1,
    gap: 2,
    maxWidth: 'calc(100% - 120px)' as any,
  },
  taskTitle: {
    color: colors.gray.light[900],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 22.4,
  },
  taskDescription: {
    color: colors.gray.light[700],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  dueDate: {
    color: colors.gray.light[400],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray.light[500],
    fontSize: typography.body.medium.fontSize,
    fontFamily: typography.body.medium.fontFamily,
    paddingTop: 20,
    textAlign: 'center',
  },
});
