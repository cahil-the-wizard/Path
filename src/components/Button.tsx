import React, {useState} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import {LucideIcon} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

export type ButtonVariant =
  | 'primary'
  | 'primary-pressed'
  | 'secondary'
  | 'secondary-disabled'
  | 'tertiary'
  | 'tertiary-hover'
  | 'ghost'
  | 'ghost-hover'
  | 'destructive'
  | 'destructive-pressed';

export type ButtonSize = 'large' | 'medium' | 'small';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'large',
  label,
  onPress,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const effectiveVariant = isHovered && !disabled ? getHoverVariant(variant) : variant;
  const buttonStyles = getButtonStyles(effectiveVariant, size);
  const iconColor = getIconColor(effectiveVariant);
  const iconSize = 18;
  const isIconOnly = !label && (LeftIcon || RightIcon);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyles.container,
        isIconOnly && buttonStyles.iconOnlyContainer,
      ]}
      onPress={onPress}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      activeOpacity={0.7}>
      {LeftIcon && (
        <View style={styles.iconContainer}>
          <LeftIcon size={iconSize} color={iconColor} strokeWidth={2} />
        </View>
      )}
      {label && <Text style={[styles.text, buttonStyles.text]}>{label}</Text>}
      {RightIcon && (
        <View style={styles.iconContainer}>
          <RightIcon size={iconSize} color={iconColor} strokeWidth={2} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const getHoverVariant = (variant: ButtonVariant): ButtonVariant => {
  switch (variant) {
    case 'primary':
      return 'primary-pressed';
    case 'tertiary':
      return 'tertiary-hover';
    case 'ghost':
      return 'ghost-hover';
    case 'destructive':
      return 'destructive-pressed';
    default:
      return variant;
  }
};

const getButtonStyles = (
  variant: ButtonVariant,
  size: ButtonSize,
): {container: ViewStyle; text: TextStyle; iconOnlyContainer?: ViewStyle} => {
  const baseContainer: ViewStyle = {
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  };

  const baseText: TextStyle = {
    fontFamily: typography.body.base.fontFamily,
    fontSize: typography.body.base.fontSize,
    fontWeight: String(typography.body.base.fontWeight) as TextStyle['fontWeight'],
    lineHeight: typography.body.base.lineHeight,
  };

  const padding = size === 'large' ? 12 : size === 'medium' ? 10 : 8;
  const iconOnlySize = size === 'large' ? 42 : size === 'medium' ? 38 : 34;

  const iconOnlyContainer: ViewStyle = {
    width: iconOnlySize,
    height: iconOnlySize,
    paddingHorizontal: 0,
    paddingVertical: 0,
  };

  switch (variant) {
    case 'primary':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.indigo[500],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: '#FFFFFF',
        },
        iconOnlyContainer,
      };
    case 'primary-pressed':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.indigo[700],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: '#FFFFFF',
        },
        iconOnlyContainer,
      };
    case 'secondary':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.gray.light[200],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: colors.gray.light[500],
        },
        iconOnlyContainer,
      };
    case 'secondary-disabled':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.gray.light[200],
          paddingVertical: padding,
          paddingHorizontal: 12,
          opacity: 0.5,
        },
        text: {
          ...baseText,
          color: colors.gray.light[500],
        },
        iconOnlyContainer,
      };
    case 'tertiary':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.gray.light[100],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: colors.gray.light[950],
        },
        iconOnlyContainer,
      };
    case 'tertiary-hover':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.gray.light[300],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: colors.gray.light[950],
        },
        iconOnlyContainer,
      };
    case 'ghost':
      return {
        container: {
          ...baseContainer,
          backgroundColor: 'transparent',
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: colors.gray.light[950],
        },
        iconOnlyContainer,
      };
    case 'ghost-hover':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.gray.light[200],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: colors.gray.light[950],
        },
        iconOnlyContainer,
      };
    case 'destructive':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.red[600],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: '#FFFFFF',
        },
        iconOnlyContainer,
      };
    case 'destructive-pressed':
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.red[700],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: '#FFFFFF',
        },
        iconOnlyContainer,
      };
    default:
      return {
        container: {
          ...baseContainer,
          backgroundColor: colors.indigo[500],
          paddingVertical: padding,
          paddingHorizontal: 12,
        },
        text: {
          ...baseText,
          color: '#FFFFFF',
        },
        iconOnlyContainer,
      };
  }
};

const getIconColor = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
    case 'primary-pressed':
    case 'destructive':
    case 'destructive-pressed':
      return '#FFFFFF';
    case 'secondary':
    case 'secondary-disabled':
      return colors.gray.light[500];
    case 'tertiary':
    case 'tertiary-hover':
    case 'ghost':
    case 'ghost-hover':
      return colors.gray.light[950];
    default:
      return '#FFFFFF';
  }
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
