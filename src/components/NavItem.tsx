import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, View, Animated} from 'react-native';
import {LucideIcon, MoreHorizontal} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

interface NavItemProps {
  label?: string;
  icon?: LucideIcon;
  active?: boolean;
  onPress?: () => void;
  onMorePress?: (e: any) => void;
  collapsed?: boolean;
  textOpacity?: Animated.Value;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  icon: Icon,
  active = false,
  onPress,
  onMorePress,
  collapsed = false,
  textOpacity,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMoreHovered, setIsMoreHovered] = useState(false);
  const iconColor = active ? colors.green[600] : colors.gray.light[950];
  const textColor = active ? colors.green[600] : colors.gray.light[950];

  const handleMoreClick = (e: any) => {
    e.stopPropagation();
    onMorePress?.(e);
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
      {/* More options button - absolutely positioned over text on hover */}
      {!collapsed && onMorePress && isHovered && (
        <View style={[styles.actionButtons, {backgroundColor: active ? colors.green[100] : colors.gray.light[200]}]}>
          <TouchableOpacity
            style={[styles.actionButton, isMoreHovered && styles.actionButtonHovered]}
            onPress={handleMoreClick}
            onMouseEnter={() => setIsMoreHovered(true)}
            onMouseLeave={() => setIsMoreHovered(false)}
          >
            <MoreHorizontal size={14} color={isMoreHovered ? colors.gray.light[700] : colors.gray.light[400]} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
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
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 16,
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
