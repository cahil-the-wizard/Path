import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, Text, StyleSheet, Animated, Easing} from 'react-native';
import {colors} from '../theme/tokens';

const STATEMENTS = [
  'Finding helpful resources',
  'Drafting bespoke content',
  'Providing more context',
];

interface EnrichmentBannerProps {
  visible: boolean;
}

const SpinningRing: React.FC = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={spinnerStyles.wrapper}>
      <View style={spinnerStyles.track} />
      <Animated.View
        style={[spinnerStyles.indicator, {transform: [{rotate}]}]}>
        <View style={spinnerStyles.arc} />
      </Animated.View>
    </View>
  );
};

const spinnerStyles = StyleSheet.create({
  wrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: 24.5,
    height: 24.5,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.gray.light[700],
    position: 'absolute',
  },
  indicator: {
    width: 24.5,
    height: 24.5,
    position: 'absolute',
  },
  arc: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: '#16B364',
    borderRightColor: '#16B364',
  },
});

const RotatingText: React.FC = () => {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  const cycle = useCallback(() => {
    // Fade out + slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateAnim, {
        toValue: -10,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIndex(prev => (prev + 1) % STATEMENTS.length);
      // Reset position below for entrance
      translateAnim.setValue(10);
      // Fade in + slide up into place
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, [fadeAnim, translateAnim]);

  useEffect(() => {
    const interval = setInterval(cycle, 3000);
    return () => clearInterval(interval);
  }, [cycle]);

  return (
    <Animated.Text
      style={[
        styles.text,
        {opacity: fadeAnim, transform: [{translateY: translateAnim}]},
      ]}>
      {STATEMENTS[index]}
    </Animated.Text>
  );
};

export const EnrichmentBanner: React.FC<EnrichmentBannerProps> = ({visible}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.positioner}>
      <View style={styles.container}>
        <SpinningRing />
        <RotatingText />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  positioner: {
    position: 'fixed' as any,
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 20,
    backgroundColor: colors.gray.dark[800],
    borderRadius: 52,
    overflow: 'hidden',
    minWidth: 265,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
    color: colors.gray.dark[200],
  },
});
