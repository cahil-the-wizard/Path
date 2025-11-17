import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {LucideIcon, Clipboard, MoreHorizontal} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {Button} from './Button';

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  showBorderOnScroll?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon: Icon,
  actions,
  showBorderOnScroll = false,
}) => {
  const [showBorder, setShowBorder] = useState(false);

  useEffect(() => {
    if (!showBorderOnScroll) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setShowBorder(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showBorderOnScroll]);

  return (
    <View style={[styles.container, showBorder && styles.containerWithBorder]}>
      <View style={styles.leftSection}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={18} color={colors.gray.light[800]} strokeWidth={1.5} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actions && (
        <View style={styles.rightSection}>
          {actions}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  containerWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light[200],
  },
  leftSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.gray.light[800],
    fontSize: typography.body.medium.fontSize,
    fontFamily: typography.body.medium.fontFamily,
    fontWeight: String(typography.body.medium.fontWeight) as any,
    lineHeight: typography.body.medium.lineHeight,
  },
  rightSection: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    padding: 8,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
