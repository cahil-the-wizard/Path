import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Easing} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {Sun, Timer, MoreHorizontal} from 'lucide-react-native';
import {Chip} from '../components/Chip';
import {colors, typography} from '../theme/tokens';
import {useNavigate} from 'react-router-dom';
import {useTasks} from '../contexts/TasksContext';
import {generateTaskSlug} from '../utils/slug';
import {apiClient} from '../services/apiClient';
import type {TaskSummary} from '../types/backend';

export const TodayV2: React.FC = () => {
  const navigate = useNavigate();
  const {tasksSummary: tasks, isLoading, refreshTasksSummary} = useTasks();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGreenStroke, setShowGreenStroke] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const strokeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only refresh when component mounts
    refreshTasksSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTaskPress = (taskId: string, taskTitle: string) => {
    const slug = generateTaskSlug(taskTitle, taskId);
    navigate(`/task/${slug}`);
  };

  // Get all available tasks (completed tasks are filtered out)
  const availableTasks = tasks.filter(task =>
    task.next_step?.id && !completedSteps.has(task.next_step.id)
  );

  // Build the rotation: [current non-skipped tasks, then skipped tasks]
  const getTaskRotation = (): TaskSummary[] => {
    const nonSkipped = availableTasks.filter(task =>
      !skippedSteps.includes(task.next_step!.id)
    );
    const skippedTasks = availableTasks.filter(task =>
      skippedSteps.includes(task.next_step!.id)
    );
    return [...nonSkipped, ...skippedTasks];
  };

  // Get the current step to display
  const getCurrentStep = (): TaskSummary | null => {
    const rotation = getTaskRotation();
    return rotation[currentIndex] || null;
  };

  const handleSkip = () => {
    const currentTask = getCurrentStep();
    if (!currentTask?.next_step?.id || isAnimating) return;

    setIsAnimating(true);

    // Animate slide + rotate + fade out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: -5,
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Add to skipped list if not already there
      const stepId = currentTask.next_step!.id;
      if (!skippedSteps.includes(stepId)) {
        setSkippedSteps(prev => [...prev, stepId]);
      }

      // Move to next task in rotation
      const rotation = getTaskRotation();
      if (currentIndex < rotation.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Reached end of rotation, start over
        setCurrentIndex(0);
      }

      slideAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(1);
      setIsAnimating(false);
    });
  };

  const handleMarkComplete = async () => {
    const currentTask = getCurrentStep();
    console.log('Mark Complete clicked', {currentTask, stepId: currentTask?.next_step?.id});

    if (!currentTask?.next_step?.id || isAnimating) {
      console.log('No current task or step ID found');
      return;
    }

    const stepId = currentTask.next_step.id;
    setIsAnimating(true);

    // Step 1: Show green stroke
    setShowGreenStroke(true);
    Animated.timing(strokeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      // Step 2: Slide + rotate + fade out after green stroke appears
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -5,
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]).start(async () => {
        // Step 3: Calculate remaining tasks BEFORE updating state
        const newCompletedSteps = new Set(completedSteps).add(stepId);
        const newSkippedSteps = skippedSteps.filter(id => id !== stepId);

        // Calculate remaining tasks with new state
        const remainingTasks = tasks.filter(task =>
          task.next_step?.id && !newCompletedSteps.has(task.next_step.id)
        );

        // Build rotation with new skipped state
        const nonSkipped = remainingTasks.filter(task =>
          !newSkippedSteps.includes(task.next_step!.id)
        );
        const skippedTasksInRotation = remainingTasks.filter(task =>
          newSkippedSteps.includes(task.next_step!.id)
        );
        const remainingRotation = [...nonSkipped, ...skippedTasksInRotation];

        // Update state
        setCompletedSteps(newCompletedSteps);
        setSkippedSteps(newSkippedSteps);

        if (remainingRotation.length === 0) {
          // Show celebration
          setShowCelebration(true);
        } else {
          // Move to next task, staying within bounds
          if (currentIndex >= remainingRotation.length) {
            setCurrentIndex(0);
          }
        }

        // Reset animations immediately so next card appears
        slideAnim.setValue(0);
        rotateAnim.setValue(0);
        fadeAnim.setValue(1);
        strokeAnim.setValue(0);
        setShowGreenStroke(false);
        setIsAnimating(false);

        // Step 4: Update backend in the background (don't wait for UI)
        apiClient.updateStep(stepId, {
          is_completed: true,
        }).then(() => {
          console.log('Step updated successfully in backend');
          // Optionally refresh in background without blocking UI
          // We don't call refreshTasksSummary here because it triggers isLoading
        }).catch((error) => {
          console.error('Failed to mark step as complete:', error);

          // Rollback: remove from completed
          setCompletedSteps(prev => {
            const newSet = new Set(prev);
            newSet.delete(stepId);
            return newSet;
          });

          setShowCelebration(false);

          // Show user-friendly error
          alert(`Failed to complete step: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
        });
      });
    });
  };

  const handleLoadMoreSteps = () => {
    // Reset state to show more tasks
    setShowCelebration(false);
    setCurrentIndex(0);
    setSkippedSteps([]);
    // Keep completed steps so we don't show them again
  };

  const today = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dateString = `${monthNames[today.getMonth()]} ${today.getDate()}`;
  const dayString = dayNames[today.getDay()];

  const currentTask = getCurrentStep();

  // Get remaining tasks for stacking effect
  const remainingTasks = getTaskRotation();

  return (
    <View style={styles.container}>
      <PageHeader
        title="Today"
        icon={Sun}
        actions={
          <TouchableOpacity style={styles.menuButton}>
            <MoreHorizontal size={18} color={colors.gray.light[950]} strokeWidth={1.5} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <View style={styles.body}>
          {/* Date and Heading Section */}
          <View style={styles.headerSection}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>{dateString}</Text>
              <View style={styles.dot} />
              <Text style={styles.dateText}>{dayString}</Text>
            </View>

            <Text style={styles.heading}>
              <Text style={styles.headingGray}>Breathe easy.{'\n'}</Text>
              <Text style={styles.headingDark}>{remainingTasks.length} steps to stay on track.</Text>
            </Text>
          </View>

          {/* Cards Section */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.indigo[600]} />
            </View>
          ) : showCelebration ? (
            <View style={styles.celebrationContainer}>
              <Text style={styles.celebrationHeading}>Great work.</Text>
              <Text style={styles.celebrationSubheading}>
                You completed your high-priority steps.{'\n'}
                Do you have enough energy for a couple more?
              </Text>
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMoreSteps}>
                <Text style={styles.loadMoreButtonText}>3 more steps</Text>
              </TouchableOpacity>
            </View>
          ) : remainingTasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {tasks.length === 0 ? 'No tasks yet. Create your first one!' : 'All done! 🎉'}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsSection}>
              {/* Stacked Cards Container */}
              <View style={styles.stackedCardsContainer}>
                {/* Background cards (stacked effect) - render 3 cards for visual effect */}
                {[0, 1, 2].map((index) => {
                  const hasTask = index < remainingTasks.length;
                  const borderColor = strokeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.gray.light[300], '#49A478'],
                  });

                  const rotation = rotateAnim.interpolate({
                    inputRange: [-5, 0],
                    outputRange: ['-5deg', '0deg'],
                  });

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.stackedCard,
                        {
                          top: index * 8,
                          left: index * 8,
                          zIndex: 3 - index,
                          opacity: !hasTask ? 0 : index === 0 ? fadeAnim : 0.6,
                          transform: index === 0 ? [{translateX: slideAnim}, {rotate: rotation}] : [],
                          borderColor: index === 0 && showGreenStroke ? borderColor : colors.gray.light[300],
                          borderWidth: index === 0 && showGreenStroke ? 2 : 1,
                        },
                      ]}>
                      {index === 0 && currentTask && (
                        <>
                          {/* Header */}
                          <View style={styles.cardHeader}>
                            <Text style={styles.taskName}>{currentTask.title}</Text>
                            <Chip
                              label={currentTask.next_step?.time_estimate || '10 minutes'}
                              color="gray"
                              leadingIcon={Timer}
                            />
                          </View>

                          {/* Content */}
                          <View style={styles.cardContent}>
                            <Text style={styles.stepTitle}>
                              {currentTask.next_step?.title || 'No steps yet'}
                            </Text>
                            <Text style={styles.description}>
                              {currentTask.next_step?.description || 'Start working on this task'}
                            </Text>
                          </View>
                        </>
                      )}
                    </Animated.View>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleMarkComplete}>
                  <Text style={styles.completeButtonText}>Mark Complete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    alignItems: 'center',
  },
  body: {
    maxWidth: 600,
    width: '100%',
    paddingTop: 100,
    flex: 1,
  },
  menuButton: {
    width: 32,
    height: 32,
    padding: 8,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: colors.gray.light[400],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 19.6,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: colors.gray.light[400],
    borderRadius: 9999,
  },
  heading: {
    width: '100%',
    textAlign: 'center',
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 39.68,
  },
  headingGray: {
    color: colors.gray.light[400],
  },
  headingDark: {
    color: colors.gray.light[800],
  },
  cardsSection: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 40,
    marginTop: 40,
  },
  stackedCardsContainer: {
    width: '100%',
    height: 183,
    position: 'relative',
  },
  stackedCard: {
    position: 'absolute',
    width: '100%',
    height: 167,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray.light[300],
    flexDirection: 'column',
    gap: 12,
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskName: {
    color: colors.gray.light[500],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  cardContent: {
    width: '100%',
    flexDirection: 'column',
    gap: 8,
  },
  stepTitle: {
    color: colors.gray.light[950],
    fontSize: 24,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 28.8,
  },
  description: {
    color: colors.gray.light[600],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.gray.light[100],
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.gray.light[950],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  completeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#49A478',
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  loadingContainer: {
    width: '100%',
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyContainer: {
    width: '100%',
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray.light[500],
    fontSize: typography.body.medium.fontSize,
    fontFamily: typography.body.medium.fontFamily,
  },
  celebrationContainer: {
    width: '100%',
    paddingTop: 100,
    alignItems: 'center',
    gap: 24,
  },
  celebrationHeading: {
    color: colors.gray.light[950],
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 39.68,
    textAlign: 'center',
  },
  celebrationSubheading: {
    color: colors.gray.light[600],
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 25.2,
    textAlign: 'center',
  },
  loadMoreButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.indigo[600],
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 22.4,
  },
});
