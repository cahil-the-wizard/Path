import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {LucideIcon} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

export type ChipColor = 'indigo' | 'success' | 'warning' | 'error' | 'gray';

interface ChipProps {
  label?: string;
  color?: ChipColor;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
}

const chipColors = {
  indigo: {
    background: colors.green[50],
    text: colors.green[600],
    icon: colors.green[600],
  },
  success: {
    background: colors.success[50],
    text: colors.success[600],
    icon: colors.success[600],
  },
  warning: {
    background: colors.warning[50],
    text: colors.warning[600],
    icon: colors.warning[600],
  },
  error: {
    background: colors.error[50],
    text: colors.error[600],
    icon: colors.error[600],
  },
  gray: {
    background: colors.gray.light[100],
    text: colors.gray.light[700],
    icon: colors.gray.light[700],
  },
};

export const Chip: React.FC<ChipProps> = ({
  label,
  color = 'indigo',
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
}) => {
  const colorScheme = chipColors[color];

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colorScheme.background},
      ]}>
      {LeadingIcon && (
        <View style={styles.iconContainer}>
          <LeadingIcon
            size={14}
            color={colorScheme.icon}
            strokeWidth={1.17}
          />
        </View>
      )}
      {label && (
        <Text style={[styles.label, {color: colorScheme.text}]}>
          {label}
        </Text>
      )}
      {TrailingIcon && (
        <View style={styles.iconContainer}>
          <TrailingIcon
            size={14}
            color={colorScheme.icon}
            strokeWidth={1.17}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    paddingLeft: 6,
    paddingRight: 7,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
});
