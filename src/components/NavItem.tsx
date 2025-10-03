import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet, View, Animated} from 'react-native';
import {LucideIcon} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

interface NavItemProps {
  label?: string;
  icon?: LucideIcon;
  active?: boolean;
  onPress?: () => void;
  collapsed?: boolean;
  textOpacity?: Animated.Value;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  icon: Icon,
  active = false,
  onPress,
  collapsed = false,
  textOpacity,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const iconColor = active ? colors.indigo[600] : colors.gray.light[950];
  const textColor = active ? colors.indigo[600] : colors.gray.light[950];

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
    backgroundColor: colors.indigo[100],
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
});
