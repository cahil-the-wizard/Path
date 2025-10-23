import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {Check, Circle, BetweenHorizontalStart} from 'lucide-react-native';
import {Button} from './Button';
import {colors, typography} from '../theme/tokens';

interface StepProps {
  title: string;
  description?: string;
  completed?: boolean;
  onToggle?: () => void;
  onSplit?: () => void;
  isSplitting?: boolean;
}

export const Step: React.FC<StepProps> = ({
  title,
  description,
  completed = false,
  onToggle,
  onSplit,
  isSplitting = false,
}) => {
  return (
    <View style={styles.container}>
      <View
        style={styles.iconContainer}
        onTouchEnd={onToggle}
        // @ts-ignore - web-specific prop
        onClick={onToggle}>
        {completed ? (
          <View style={styles.completedIcon}>
            <Check size={12} color="white" strokeWidth={2} />
          </View>
        ) : (
          <Circle size={24} color={colors.gray.light[400]} strokeWidth={1.5} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              completed && styles.completedTitle,
            ]}>
            {title}
          </Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          {onSplit && !completed && (
            <View style={styles.buttonContainer}>
              {isSplitting ? (
                <View style={styles.splittingButton}>
                  <ActivityIndicator size="small" color={colors.gray.light[950]} />
                  <Text style={styles.splittingText}>Splitting...</Text>
                </View>
              ) : (
                <Button
                  variant="tertiary"
                  size="small"
                  label="Split"
                  leftIcon={BetweenHorizontalStart}
                  onPress={onSplit}
                  disabled={isSplitting}
                />
              )}
            </View>
          )}
        </View>
        <View style={styles.divider} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    paddingTop: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    cursor: 'pointer',
  },
  completedIcon: {
    width: 24,
    height: 24,
    backgroundColor: colors.success[500],
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 20,
  },
  textContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    color: colors.gray.light[950],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: '500',
    lineHeight: typography.body.base.lineHeight,
  },
  completedTitle: {
    color: colors.gray.light[400],
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  description: {
    alignSelf: 'stretch',
    color: colors.gray.light[600],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: String(typography.body.base.fontWeight) as any,
    lineHeight: typography.body.base.lineHeight,
  },
  buttonContainer: {
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
  },
  splittingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gray.light[100],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 38,
  },
  splittingText: {
    color: colors.gray.light[950],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: String(typography.body.base.fontWeight) as any,
    lineHeight: typography.body.base.lineHeight,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.gray.light[300],
    borderRadius: 20,
  },
});
