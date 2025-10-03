import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {CardStepIndicator} from './CardStepIndicator';
import {Chip} from './Chip';
import {colors, typography} from '../theme/tokens';

interface TodayCardProps {
  taskName: string;
  totalSteps: number;
  completedSteps: number;
  stepTitle: string;
  description: string;
  chipIcon?: any;
  chipLabel: string;
  onPress?: () => void;
}

export const TodayCard: React.FC<TodayCardProps> = ({
  taskName,
  totalSteps,
  completedSteps,
  stepTitle,
  description,
  chipIcon,
  chipLabel,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.taskName}>{taskName}</Text>
          <CardStepIndicator
            totalSteps={totalSteps}
            completedSteps={completedSteps}
          />
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onPress}>
          <ChevronRight
            size={14}
            color={colors.gray.light[700]}
            strokeWidth={1.17}
          />
        </TouchableOpacity>
      </View>

      {/* Step Title */}
      <Text style={styles.stepTitle}>{stepTitle}</Text>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Chip */}
      <View style={styles.chipContainer}>
        <Chip label={chipLabel} color="indigo" leadingIcon={chipIcon} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.gray.light[200],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light[200],
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
  },
  taskName: {
    color: colors.gray.light[500],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  iconButton: {
    width: 22,
    height: 22,
    backgroundColor: colors.gray.light[100],
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stepTitle: {
    color: colors.gray.light[950],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: '500',
    lineHeight: typography.body.base.lineHeight,
  },
  description: {
    alignSelf: 'stretch',
    color: colors.gray.light[600],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  chipContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 6,
  },
});
