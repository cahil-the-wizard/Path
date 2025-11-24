import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {Sun, Timer} from 'lucide-react-native';
import {TodayCard} from '../components/TodayCard';
import {colors, typography} from '../theme/tokens';
import {useNavigate} from 'react-router-dom';
import {useTasks} from '../contexts/TasksContext';
import {generateTaskSlug} from '../utils/slug';

export const Today: React.FC = () => {
  const navigate = useNavigate();
  const {tasksSummary: tasks, isLoading, refreshTasksSummary} = useTasks();

  useEffect(() => {
    refreshTasksSummary();
  }, [refreshTasksSummary]);

  const handleTaskPress = (taskId: string, taskTitle: string) => {
    const slug = generateTaskSlug(taskTitle, taskId);
    navigate(`/task/${slug}`);
  };

  const today = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dateString = `${monthNames[today.getMonth()]} ${today.getDate()}`;
  const dayString = dayNames[today.getDay()];

  return (
    <View style={styles.container}>
      <PageHeader title="Today" icon={Sun} />
      <View style={styles.content}>
        <View style={styles.body}>
          <Text style={styles.heading}>
            <Text style={styles.headingGray}>Breathe easy.{'\n'}</Text>
            <Text style={styles.headingIndigo}>{tasks.length} steps</Text>
            <Text style={styles.headingDark}>{' '}to stay on track.</Text>
          </Text>

          <View style={styles.stepsTable}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>{dateString}</Text>
              <View style={styles.dot} />
              <Text style={styles.dateText}>{dayString}</Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.green[600]} />
              </View>
            ) : tasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tasks yet. Create your first one!</Text>
              </View>
            ) : (
              <View style={styles.cardsContainer}>
                {tasks.map(task => (
                  <TodayCard
                    key={task.id}
                    taskId={task.id}
                    taskName={task.title}
                    totalSteps={0}
                    completedSteps={0}
                    stepTitle={task.next_step?.title || 'No steps yet'}
                    description=""
                    chipIcon={Timer}
                    chipLabel={task.next_step?.time_estimate || ''}
                    onPress={() => handleTaskPress(task.id, task.title)}
                  />
                ))}
              </View>
            )}
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
    alignItems: 'center',
  },
  body: {
    maxWidth: 600,
    width: '100%',
    paddingTop: 44,
  },
  heading: {
    width: '100%',
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 39.68,
  },
  headingGray: {
    color: colors.gray.light[500],
  },
  headingIndigo: {
    color: colors.green[600],
  },
  headingDark: {
    color: colors.gray.light[900],
  },
  stepsTable: {
    width: '100%',
    paddingTop: 24,
  },
  dateHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: colors.gray.light[700],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: '600',
    lineHeight: typography.body.small.lineHeight,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: colors.gray.light[700],
    borderRadius: 9999,
  },
  cardsContainer: {
    width: '100%',
    paddingTop: 16,
  },
  loadingContainer: {
    width: '100%',
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    width: '100%',
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.gray.light[500],
    fontSize: typography.body.medium.fontSize,
    fontFamily: typography.body.medium.fontFamily,
  },
});
