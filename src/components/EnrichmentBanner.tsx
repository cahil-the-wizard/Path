import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {colors, typography} from '../theme/tokens';

interface EnrichmentBannerProps {
  visible: boolean;
}

export const EnrichmentBanner: React.FC<EnrichmentBannerProps> = ({visible}) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={16} color={colors.indigo[600]} />
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
  text: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.indigo[700],
    flex: 1,
  },
});
