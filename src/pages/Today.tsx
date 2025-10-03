import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {Sun, Timer} from 'lucide-react-native';
import {TodayCard} from '../components/TodayCard';
import {colors, typography} from '../theme/tokens';

export const Today: React.FC = () => {
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
            <Text style={styles.headingIndigo}>3 steps</Text>
            <Text style={styles.headingDark}> to stay on track.</Text>
          </Text>

          <View style={styles.stepsTable}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>{dateString}</Text>
              <View style={styles.dot} />
              <Text style={styles.dateText}>{dayString}</Text>
            </View>

            <View style={styles.cardsContainer}>
              <TodayCard
                taskName="Blog Post"
                totalSteps={5}
                completedSteps={3}
                stepTitle="Draft content outline"
                description="Create a simple outline with intro, 3–4 main points, and a conclusion"
                chipIcon={Timer}
                chipLabel="10 minutes of focus"
              />
              <TodayCard
                taskName="Blog Post"
                totalSteps={5}
                completedSteps={3}
                stepTitle="Draft content outline"
                description="Create a simple outline with intro, 3–4 main points, and a conclusion"
                chipIcon={Timer}
                chipLabel="10 minutes of focus"
              />
              <TodayCard
                taskName="Blog Post"
                totalSteps={5}
                completedSteps={3}
                stepTitle="Draft content outline"
                description="Create a simple outline with intro, 3–4 main points, and a conclusion"
                chipIcon={Timer}
                chipLabel="10 minutes of focus"
              />
            </View>
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
    color: colors.indigo[600],
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
});
