import React from 'react';
import {View, StyleSheet} from 'react-native';
import {colors} from '../theme/tokens';

interface CardStepIndicatorProps {
  totalSteps: number;
  completedSteps: number;
}

export const CardStepIndicator: React.FC<CardStepIndicatorProps> = ({
  totalSteps,
  completedSteps,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({length: totalSteps}, (_, index) => (
        <View
          key={index}
          style={[
            styles.step,
            {
              backgroundColor:
                index < completedSteps
                  ? colors.success[400]
                  : colors.gray.light[200],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 2,
  },
  step: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
});
