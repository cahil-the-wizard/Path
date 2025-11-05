import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Pressable} from 'react-native';
import {Check, Circle, BetweenHorizontalStart, Clock, CheckCircle2, CircleDashed} from 'lucide-react-native';
import {Button} from './Button';
import {colors, typography} from '../theme/tokens';

interface StepProps {
  title: string;
  description?: string;
  timeEstimate?: string;
  completionCue?: string;
  completed?: boolean;
  onToggle?: () => void;
  onSplit?: () => void;
  isSplitting?: boolean;
}

export const Step: React.FC<StepProps> = ({
  title,
  description,
  timeEstimate,
  completionCue,
  completed = false,
  onToggle,
  onSplit,
  isSplitting = false,
}) => {
  // Parse description if it's a JSON array string
  const parseDescription = (desc?: string): string[] => {
    if (!desc) return [];
    try {
      const parsed = JSON.parse(desc);
      return Array.isArray(parsed) ? parsed : [desc];
    } catch {
      return [desc];
    }
  };

  const descriptionItems = parseDescription(description);

  return (
    <View style={styles.wrapper}>
      <View style={styles.divider} />
      <View style={styles.container}>
        <Pressable
          style={styles.iconContainer}
          onPress={onToggle}>
          {completed ? (
            <View style={styles.completedIcon}>
              <Check size={12} color="white" strokeWidth={2} />
            </View>
          ) : (
            <Circle size={24} color={colors.gray.light[400]} strokeWidth={1.5} />
          )}
        </Pressable>

        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                completed && styles.completedTitle,
              ]}>
              {title}
            </Text>
            {!completed && timeEstimate && (
              <View style={styles.metadataItem}>
                <Clock size={18} color={colors.gray.light[950]} strokeWidth={1.12} />
                <Text style={styles.metadataValue}>{timeEstimate}</Text>
              </View>
            )}
            {!completed && descriptionItems.length > 0 && (
              <>
                {descriptionItems.map((item, index) => (
                  <View key={index} style={styles.metadataItem}>
                    <CircleDashed size={18} color={colors.gray.light[950]} strokeWidth={1.12} />
                    <Text style={styles.metadataValue}>{item}</Text>
                  </View>
                ))}
              </>
            )}
            {/* Completion cue hidden for now */}
            {/* {!completed && completionCue && (
              <View style={styles.metadataItem}>
                <CheckCircle2 size={18} color={colors.gray.light[950]} strokeWidth={1.12} />
                <Text style={styles.metadataValue}>{completionCue}</Text>
              </View>
            )} */}
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
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'column',
    gap: 20,
    paddingBottom: 20,
  },
  container: {
    alignSelf: 'stretch',
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
    // @ts-ignore - web-specific styles
    userSelect: 'none',
    // @ts-ignore
    WebkitUserSelect: 'none',
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
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 22.4,
  },
  completedTitle: {
    color: colors.gray.light[400],
    fontWeight: '400',
    textDecorationLine: 'line-through',
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
  metadataItem: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metadataValue: {
    flex: 1,
    color: colors.gray.light[600],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
  },
});
