import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography} from '../theme/tokens';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({text, children}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({x: 0, y: 0});
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 28, // Position above the button
      });
    }
  }, [isVisible]);

  return (
    <>
      <View
        ref={containerRef}
        style={styles.container}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}>
        {children}
      </View>
      {isVisible && (
        <View style={[styles.tooltipPortal, {left: position.x, top: position.y}]}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{text}</Text>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltipPortal: {
    position: 'fixed',
    zIndex: 10000,
    pointerEvents: 'none',
    transform: [{translateX: '-50%'}],
  },
  tooltip: {
    backgroundColor: colors.gray.light[900],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    transform: [{translateY: -8}],
  },
  tooltipText: {
    color: 'white',
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
    whiteSpace: 'nowrap',
  },
});
