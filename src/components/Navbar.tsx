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
  Calendar,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import {NavItem} from './NavItem';
import {colors, typography} from '../theme/tokens';
import {authService} from '../services/auth';
import {apiClient} from '../services/apiClient';
import {useNavigate} from 'react-router-dom';
import type {Task} from '../types/backend';

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
      <CirclePlus size={18} color={colors.indigo[600]} strokeWidth={1.5} />
      {!collapsed && (
        <Animated.View style={{opacity: textOpacity}}>
          <Text style={styles.addTaskText}>Add task</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

interface NavbarProps {
  onNavigate: (page: 'today' | 'calendar' | 'newTask' | 'taskDetail') => void;
  currentPage: 'today' | 'calendar' | 'newTask' | 'taskDetail';
}

export const Navbar: React.FC<NavbarProps> = ({onNavigate, currentPage}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredOnLogo, setHoveredOnLogo] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const widthAnim = useRef(new Animated.Value(240)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await apiClient.getTasks({ status: 'active', limit: 10 });
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setShowProfileMenu(false);
      navigate('/auth');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

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
            ) : (
              <View style={styles.logo} />
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
              label="Calendar"
              icon={Calendar}
              active={currentPage === 'calendar'}
              collapsed={collapsed}
              onPress={() => onNavigate('calendar')}
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
                <Text style={styles.tasksSectionTitle}>Tasks</Text>
              </View>
              <ScrollView style={styles.tasksList}>
                {loadingTasks ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.indigo[600]} />
                  </View>
                ) : tasks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tasks yet</Text>
                  </View>
                ) : (
                  tasks.map(task => (
                    <NavItem
                      key={task.id}
                      label={task.title}
                      collapsed={collapsed}
                      active={false}
                      onPress={() => onNavigate('taskDetail')}
                      textOpacity={opacityAnim}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Spacer for collapsed state */}
        {collapsed && <View style={{flex: 1}} />}

        {/* User Profile */}
        <View style={styles.profileContainer}>
          <Animated.View style={{opacity: opacityAnim}}>
            {!collapsed && (
              <TouchableOpacity
                style={styles.userProfile}
                onPress={() => setShowProfileMenu(!showProfileMenu)}>
                <Image
                  source={{uri: 'https://via.placeholder.com/34'}}
                  style={styles.avatar}
                />
                <Text style={styles.userName}>Cahil Sankar</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          {collapsed && (
            <TouchableOpacity
              style={styles.userProfileCollapsed}
              onPress={() => setShowProfileMenu(!showProfileMenu)}>
              <Image
                source={{uri: 'https://via.placeholder.com/34'}}
                style={styles.avatar}
              />
            </TouchableOpacity>
          )}

          {/* Profile Menu Popover */}
          {showProfileMenu && (
            <View style={[styles.profileMenu, collapsed && styles.profileMenuCollapsed]}>
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
    justifyContent: 'space-between',
  },
  innerContainerCollapsed: {
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: 12,
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
    width: 34,
    height: 34,
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
    backgroundColor: colors.indigo[100],
    borderRadius: 8,
  },
  addTaskButtonHover: {
    backgroundColor: colors.gray.light[200],
    borderRadius: 8,
  },
  addTaskText: {
    color: colors.indigo[600],
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
    marginVertical: 10,
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
    backgroundColor: '#D9D9D9',
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
