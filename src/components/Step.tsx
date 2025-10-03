import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Check, Circle} from 'lucide-react-native';
import {Button} from './Button';
import {colors, typography} from '../theme/tokens';

interface StepProps {
  title: string;
  description?: string;
  completed?: boolean;
  onSplit?: () => void;
}

export const Step: React.FC<StepProps> = ({
  title,
  description,
  completed = false,
  onSplit,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
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
              <Button
                variant="tertiary"
                size="small"
                label="Split"
                leftIcon={Circle}
                onPress={onSplit}
              />
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 10,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.gray.light[300],
    borderRadius: 20,
  },
});
