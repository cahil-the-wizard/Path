import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, View, Animated} from 'react-native';
import {LucideIcon, Trash2, CircleCheck} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

interface NavItemProps {
  label?: string;
  icon?: LucideIcon;
  active?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  collapsed?: boolean;
  textOpacity?: Animated.Value;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  icon: Icon,
  active = false,
  onPress,
  onDelete,
  onComplete,
  collapsed = false,
  textOpacity,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [isCompleteHovered, setIsCompleteHovered] = useState(false);
  const iconColor = active ? colors.green[600] : colors.gray.light[950];
  const textColor = active ? colors.green[600] : colors.gray.light[950];

  const handleDeleteClick = (e: any) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleCompleteClick = (e: any) => {
    e.stopPropagation();
    onComplete?.();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        active && styles.activeContainer,
        collapsed && styles.collapsedContainer,
        !active && isHovered && styles.hoverContainer,
      ]}
      onPress={onPress}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      activeOpacity={0.7}>
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon size={18} color={iconColor} strokeWidth={1.5} />
        </View>
      )}
      {!collapsed && label && textOpacity && (
        <Animated.View style={{opacity: textOpacity, flex: 1}}>
          <Text
            style={[styles.text, {color: textColor}]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {label}
          </Text>
        </Animated.View>
      )}
      {!collapsed && label && !textOpacity && (
        <Text
          style={[styles.text, {color: textColor}]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {label}
        </Text>
      )}
      {/* Action icons on hover */}
      {!collapsed && (onComplete || onDelete) && isHovered && (
        <View style={styles.actionButtons}>
          {onComplete && (
            <TouchableOpacity
              style={[styles.actionButton, isCompleteHovered && styles.actionButtonHovered]}
              onPress={handleCompleteClick}
              onMouseEnter={() => setIsCompleteHovered(true)}
              onMouseLeave={() => setIsCompleteHovered(false)}
              // @ts-ignore - web-specific attribute for tooltip
              title="Mark complete"
            >
              <CircleCheck size={14} color={isCompleteHovered ? colors.green[600] : colors.gray.light[400]} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, isDeleteHovered && styles.actionButtonHovered]}
              onPress={handleDeleteClick}
              onMouseEnter={() => setIsDeleteHovered(true)}
              onMouseLeave={() => setIsDeleteHovered(false)}
              // @ts-ignore - web-specific attribute for tooltip
              title="Delete"
            >
              <Trash2 size={14} color={isDeleteHovered ? colors.gray.light[700] : colors.gray.light[400]} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  activeContainer: {
    backgroundColor: colors.green[100],
    borderRadius: 8,
  },
  hoverContainer: {
    backgroundColor: colors.gray.light[200],
    borderRadius: 8,
  },
  collapsedContainer: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: 34,
    height: 34,
    alignSelf: 'center',
  },
  iconContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    fontFamily: typography.body.small.fontFamily,
    fontSize: typography.body.small.fontSize,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonHovered: {
    backgroundColor: colors.gray.light[300],
  },
});
