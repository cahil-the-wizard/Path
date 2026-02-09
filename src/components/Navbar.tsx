import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  CirclePlus,
  Sun,
  CircleCheckBig,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Settings as SettingsIcon,
  Sparkles,
  Copy,
  Edit,
  Trash2,
  MessageSquare,
} from 'lucide-react-native';
import {NavItem} from './NavItem';
import {ConfirmationModal} from './ConfirmationModal';
import {Dropdown, DropdownItem} from './Dropdown';
import {RewriteTaskModal} from './RewriteTaskModal';
import {colors, typography} from '../theme/tokens';
import {useAuth} from '../contexts/AuthContext';
import {useNavigate, useLocation} from 'react-router-dom';
import {useTasks} from '../contexts/TasksContext';
import {generateTaskSlug, getTaskIdFromSlug} from '../utils/slug';
import {apiClient} from '../services/apiClient';

interface AddTaskButtonProps {
  collapsed: boolean;
  onPress: () => void;
  active: boolean;
  textOpacity: Animated.Value;
}

const AddTaskButton: React.FC<AddTaskButtonProps> = ({collapsed, onPress, active, textOpacity}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={[
        styles.addTaskButton,
        collapsed && styles.addTaskButtonCollapsed,
        active && styles.addTaskButtonActive,
        !active && isHovered && styles.addTaskButtonHover,
      ]}>
      <CirclePlus size={18} color={colors.green[600]} strokeWidth={1.5} />
      {!collapsed && (
        <Animated.View style={{opacity: textOpacity}}>
          <Text style={styles.addTaskText}>Add task</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

interface NavbarProps {
  onNavigate: (page: 'today' | 'newTask' | 'tasksList' | 'taskDetail') => void;
  currentPage: 'today' | 'newTask' | 'tasksList' | 'taskDetail';
}

export const Navbar: React.FC<NavbarProps> = ({onNavigate, currentPage}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredOnLogo, setHoveredOnLogo] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{id: string; title: string} | null>(null);
  const [selectedTask, setSelectedTask] = useState<{id: string; title: string} | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({x: 0, y: 0});
  const [showRewriteTaskModal, setShowRewriteTaskModal] = useState(false);
  const widthAnim = useRef(new Animated.Value(240)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scrollContainerHeight = useRef(0);
  const scrollContentHeight = useRef(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {tasks, isLoading: loadingTasks, isLoadingMore, hasMoreTasks, refreshTasks, loadMoreTasks} = useTasks();
  const {signOut, userData} = useAuth();

  // Get user's name and first initial for avatar
  const displayName = userData.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Extract current task ID prefix from URL if on task detail page
  const currentTaskSlug = location.pathname.startsWith('/task/')
    ? location.pathname.split('/task/')[1]
    : null;
  const currentTaskIdPrefix = currentTaskSlug ? getTaskIdFromSlug(currentTaskSlug) : null;

  useEffect(() => {
    // Only refresh when component mounts or when user changes
    refreshTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setShowProfileMenu(false);
      navigate('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await apiClient.deleteTask(taskToDelete.id);
      // If we're viewing the deleted task, navigate away
      if (currentTaskIdPrefix && taskToDelete.id.startsWith(currentTaskIdPrefix)) {
        navigate('/');
      }
      refreshTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleMorePress = (e: any, task: {id: string; title: string}) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      x: rect.left,
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
      const queueStatus = await apiClient.pollQueueStatus(response.queue_id);

      if (queueStatus.result?.task_id) {
        await refreshTasks();
        const slug = generateTaskSlug(selectedTask.title + ' (copy)', queueStatus.result.task_id);
        navigate(`/task/${slug}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate task');
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
      await apiClient.pollQueueStatus(response.queue_id);
      await refreshTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to rewrite task');
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
        if (selectedTask) {
          setTaskToDelete(selectedTask);
        }
      },
      variant: 'destructive',
    },
  ];

  const toggleCollapse = () => {
    const toValue = collapsed ? 240 : 60;
    const opacityToValue = collapsed ? 1 : 0;

    if (!collapsed) {
      // When collapsing, fade out text first, then shrink
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(widthAnim, {
          toValue,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // When expanding, expand first, then fade in text
      Animated.sequence([
        Animated.timing(widthAnim, {
          toValue,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }

    setCollapsed(!collapsed);
  };

  useEffect(() => {
    widthAnim.setValue(collapsed ? 60 : 240);
  }, []);

  return (
    <Animated.View style={[styles.container, {width: widthAnim}]}>
      <View style={[styles.innerContainer, collapsed && styles.innerContainerCollapsed]}>
        {/* Header */}
        <View style={[styles.header, collapsed && styles.headerCollapsed]}>
          <TouchableOpacity
            onPress={collapsed ? toggleCollapse : undefined}
            onMouseEnter={() => collapsed && setHoveredOnLogo(true)}
            onMouseLeave={() => setHoveredOnLogo(false)}
            style={[
              styles.logoContainer,
              collapsed && styles.logoContainerCollapsed,
              collapsed && hoveredOnLogo && styles.logoContainerHover,
            ]}>
            {collapsed && hoveredOnLogo ? (
              <PanelLeftOpen
                size={18}
                color={colors.gray.light[950]}
                strokeWidth={1.5}
              />
            ) : collapsed ? (
              <Image
                source={{uri: '/assets/logo-collapsed.svg'}}
                style={styles.logoCollapsed}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={{uri: '/assets/logo-expanded.svg'}}
                style={styles.logoExpanded}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
          <Animated.View style={{opacity: opacityAnim}}>
            {!collapsed && (
              <TouchableOpacity
                onPress={toggleCollapse}
                style={styles.collapseButton}>
                <PanelLeftClose
                  size={18}
                  color={colors.gray.light[500]}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* Main Navigation */}
        <View style={[styles.mainNav, collapsed && styles.mainNavCollapsed]}>
          <AddTaskButton
            collapsed={collapsed}
            onPress={() => onNavigate('newTask')}
            active={currentPage === 'newTask'}
            textOpacity={opacityAnim}
          />
          <View style={[styles.navGroup, collapsed && styles.navGroupCollapsed]}>
            <NavItem
              label="Today"
              icon={Sun}
              active={currentPage === 'today'}
              collapsed={collapsed}
              onPress={() => onNavigate('today')}
              textOpacity={opacityAnim}
            />
            <NavItem
              label="Tasks"
              icon={CircleCheckBig}
              active={currentPage === 'tasksList'}
              collapsed={collapsed}
              onPress={() => onNavigate('tasksList')}
              textOpacity={opacityAnim}
            />
          </View>
        </View>

        {/* Divider */}
        <Animated.View style={{opacity: opacityAnim}}>
          {!collapsed && (
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
            </View>
          )}
        </Animated.View>

        {/* Tasks Section */}
        <Animated.View style={{opacity: opacityAnim, flex: !collapsed ? 1 : 0}}>
          {!collapsed && (
            <View style={styles.tasksSection}>
              <View style={styles.tasksSectionHeader}>
                <Text style={styles.tasksSectionTitle}>Active</Text>
              </View>
              <ScrollView
                style={styles.tasksList}
                onScroll={(e) => {
                  const {layoutMeasurement, contentOffset, contentSize} = e.nativeEvent;
                  const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
                  if (isNearBottom && hasMoreTasks && !isLoadingMore) {
                    loadMoreTasks();
                  }
                }}
                onLayout={(e) => {
                  scrollContainerHeight.current = e.nativeEvent.layout.height;
                  // Check overflow when container size changes
                  setHasOverflow(scrollContentHeight.current > scrollContainerHeight.current);
                }}
                onContentSizeChange={(contentWidth, contentHeight) => {
                  scrollContentHeight.current = contentHeight;
                  // Check overflow when content size changes
                  setHasOverflow(contentHeight > scrollContainerHeight.current);
                  // Auto-load more if content doesn't fill the container
                  if (scrollContainerHeight.current > 0 && contentHeight < scrollContainerHeight.current && hasMoreTasks && !isLoadingMore && !loadingTasks) {
                    loadMoreTasks();
                  }
                }}
                scrollEventThrottle={400}
              >
                {loadingTasks ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.green[600]} />
                  </View>
                ) : tasks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tasks yet</Text>
                  </View>
                ) : (
                  <>
                    {tasks.map(task => (
                      <NavItem
                        key={task.id}
                        label={task.title}
                        collapsed={collapsed}
                        active={currentTaskIdPrefix !== null && task.id.startsWith(currentTaskIdPrefix)}
                        onPress={() => navigate(`/task/${generateTaskSlug(task.title, task.id)}`)}
                        onMorePress={(e) => handleMorePress(e, {id: task.id, title: task.title})}
                        textOpacity={opacityAnim}
                      />
                    ))}
                    {isLoadingMore && (
                      <View style={styles.loadingMoreContainer}>
                        <ActivityIndicator size="small" color={colors.green[600]} />
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Spacer for collapsed state */}
        {collapsed && <View style={{flex: 1}} />}

        {/* Divider above profile when tasks list has overflow */}
        {!collapsed && hasOverflow && (
          <View style={styles.profileDivider} />
        )}

        {/* User Profile */}
        <View style={styles.profileContainer}>
          <Animated.View style={{opacity: opacityAnim}}>
            {!collapsed && (
              <TouchableOpacity
                style={styles.userProfile}
                onPress={() => setShowProfileMenu(!showProfileMenu)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </View>
                <Text style={styles.userName}>{displayName}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          {collapsed && (
            <TouchableOpacity
              style={styles.userProfileCollapsed}
              onPress={() => setShowProfileMenu(!showProfileMenu)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Profile Menu Popover */}
          {showProfileMenu && (
            <View style={[styles.profileMenu, collapsed && styles.profileMenuCollapsed]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  const subject = encodeURIComponent('Path Feedback');
                  const body = encodeURIComponent(`Hi Path Team,

I wanted to share some feedback:

[Your feedback here]

Thanks!`);
                  window.location.href = `mailto:feedback@totallywizard.dev?subject=${subject}&body=${body}`;
                }}>
                <MessageSquare size={16} color={colors.gray.light[700]} strokeWidth={1.5} />
                <Text style={styles.menuItemText}>Submit feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowProfileMenu(false);
                  onNavigate('settings');
                }}>
                <SettingsIcon size={16} color={colors.gray.light[700]} strokeWidth={1.5} />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <LogOut size={16} color={colors.gray.light[700]} strokeWidth={1.5} />
                <Text style={styles.menuItemText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Task Dropdown */}
        <Dropdown
          items={dropdownItems}
          visible={showDropdown}
          onClose={() => setShowDropdown(false)}
          position={dropdownPosition}
        />

        {/* Rewrite Task Modal */}
        <RewriteTaskModal
          visible={showRewriteTaskModal}
          taskTitle={selectedTask?.title || ''}
          onConfirm={handleRewriteTask}
          onCancel={() => setShowRewriteTaskModal(false)}
        />

        {/* Delete Task Confirmation Modal */}
        <ConfirmationModal
          visible={taskToDelete !== null}
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={handleDeleteTask}
          onCancel={() => setTaskToDelete(null)}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray.light[100],
    height: '100vh',
    position: 'sticky',
    top: 0,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 20,
    flexDirection: 'column',
  },
  innerContainerCollapsed: {
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerCollapsed: {
    justifyContent: 'center',
  },
  logoContainer: {
    height: 34,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  logoContainerCollapsed: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainerHover: {
    backgroundColor: colors.gray.light[200],
    borderRadius: 8,
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 6.44,
    backgroundColor: colors.gray.light[400],
  },
  logoCollapsed: {
    width: 34,
    height: 34,
  },
  logoExpanded: {
    width: 120,
    height: 34,
  },
  collapseButton: {
    padding: 8,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainNav: {
    gap: 4,
  },
  mainNavCollapsed: {
    alignItems: 'center',
  },
  addTaskButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  addTaskButtonCollapsed: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  addTaskButtonActive: {
    backgroundColor: colors.green[100],
    borderRadius: 8,
  },
  addTaskButtonHover: {
    backgroundColor: colors.gray.light[200],
    borderRadius: 8,
  },
  addTaskText: {
    color: colors.green[600],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  navGroup: {
    gap: 0,
  },
  navGroupCollapsed: {
    alignItems: 'center',
  },
  dividerContainer: {
    paddingHorizontal: 8,
    marginVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray.light[300],
  },
  tasksSection: {
    flex: 1,
  },
  tasksSectionHeader: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  tasksSectionTitle: {
    color: colors.gray.light[600],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  tasksList: {
    flex: 1,
  },
  profileDivider: {
    height: 1,
    backgroundColor: colors.gray.light[300],
    marginHorizontal: 8,
    marginBottom: 8,
  },
  profileContainer: {
    position: 'relative',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  userProfileCollapsed: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    backgroundColor: colors.green[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    lineHeight: 20,
  },
  userName: {
    color: colors.gray.light[900],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: String(typography.body.base.fontWeight) as any,
    lineHeight: typography.body.base.lineHeight,
  },
  profileMenu: {
    position: 'absolute',
    bottom: 60,
    left: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 4,
  },
  profileMenuCollapsed: {
    left: 60,
    right: 'auto',
    width: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: 'pointer',
  },
  menuItemText: {
    color: colors.gray.light[700],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.gray.light[200],
    marginVertical: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreContainer: {
    padding: 12,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[500],
  },
});
