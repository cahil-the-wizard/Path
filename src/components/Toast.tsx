import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {X} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

interface ToastProps {
  visible: boolean;
  message: string;
  actionText?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  actionText,
  onAction,
  onClose,
  duration = 5000,
}) => {
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(100);
    }
  }, [visible, slideAnim, duration]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.message}>
            {message}{' '}
            {actionText && onAction && (
              <Text style={styles.actionText} onPress={onAction}>
                {actionText}
              </Text>
            )}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <X size={16} color="#94979C" strokeWidth={1.78} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#22262F',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 450,
    width: '100%',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 20,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 20,
    textDecorationLine: 'underline',
    // @ts-ignore - web-specific
    cursor: 'pointer',
  },
  closeButton: {
    padding: 0,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
