import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Modal} from 'react-native';
import {Sparkles} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

interface TaskGenerationModalProps {
  visible: boolean;
  onComplete?: () => void;
}

const loadingMessages = [
  'Analyzing your task...',
  'Breaking it down into steps...',
  'Crafting your personalized path...',
  'Almost there...',
];

export const TaskGenerationModal: React.FC<TaskGenerationModalProps> = ({
  visible,
  onComplete,
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex(prev => {
        const next = prev + 1;
        if (next >= loadingMessages.length) {
          clearInterval(interval);
          return prev;
        }
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Sparkles size={32} color={colors.green[600]} strokeWidth={1.5} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Creating your path</Text>
            <Text style={styles.message}>{loadingMessages[messageIndex]}</Text>
          </View>

          <ActivityIndicator size="large" color={colors.green[600]} style={styles.loader} />

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {width: `${((messageIndex + 1) / loadingMessages.length) * 100}%`},
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    maxWidth: 440,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.heading.subheading.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[900],
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[600],
    textAlign: 'center',
  },
  loader: {
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray.light[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green[600],
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
});
