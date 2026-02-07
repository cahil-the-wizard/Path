import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Pressable} from 'react-native';
import {createPortal} from 'react-dom';
import {LucideIcon} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

export interface DropdownItem {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}

interface DropdownProps {
  items: DropdownItem[];
  visible: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<View>;
  align?: 'left' | 'right';
  position?: {x: number; y: number};
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  visible,
  onClose,
  align = 'right',
  position,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!visible) return null;

  const dropdownStyle = position
    ? {
        position: 'fixed' as const,
        left: position.x,
        top: position.y,
      }
    : align === 'right'
    ? styles.alignRight
    : styles.alignLeft;

  const content = (
    <>
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />

      {/* Dropdown Menu */}
      <View style={[styles.container, dropdownStyle]}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.item,
              hoveredIndex === index && styles.itemHovered,
            ]}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}>
            {item.icon && (
              <item.icon
                size={16}
                color={item.variant === 'destructive' ? colors.red[600] : colors.gray.light[700]}
                strokeWidth={1.5}
              />
            )}
            <Text
              style={[
                styles.itemText,
                item.variant === 'destructive' && styles.itemTextDestructive,
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  // Use portal to render outside parent container (avoids clipping from transforms)
  return createPortal(content, document.body);
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 998,
  } as any,
  container: {
    position: 'absolute',
    top: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 4,
    minWidth: 160,
    zIndex: 999,
  },
  alignRight: {
    right: 20,
  },
  alignLeft: {
    left: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: 'pointer',
  } as any,
  itemHovered: {
    backgroundColor: colors.gray.light[50],
  },
  itemText: {
    color: colors.gray.light[700],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  itemTextDestructive: {
    color: colors.red[600],
  },
});
