import React from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {colors, typography} from '../theme/tokens';

interface EnrichmentBannerProps {
  visible: boolean;
}

export const EnrichmentBanner: React.FC<EnrichmentBannerProps> = ({visible}) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      const animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [visible, spinValue]);

  if (!visible) {
    return null;
  }

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, {transform: [{rotate: spin}]}]} />
      <Text style={styles.text}>Finding helpful resources and drafting content...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.indigo[50],
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.indigo[500],
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: colors.indigo[500],
    borderTopColor: 'transparent',
    borderRadius: 8,
  },
  text: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.indigo[700],
    flex: 1,
  },
});
