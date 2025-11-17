import React, {useState} from 'react';
import {View, Text, StyleSheet, Modal, Pressable} from 'react-native';
import {TextInput} from './TextInput';
import {Button} from './Button';
import {AlertCircle} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

interface RewriteTaskModalProps {
  visible: boolean;
  taskTitle: string;
  onConfirm: (prompt: string) => void;
  onCancel: () => void;
}

export const RewriteTaskModal: React.FC<RewriteTaskModalProps> = ({
  visible,
  taskTitle,
  onConfirm,
  onCancel,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleConfirm = () => {
    if (prompt.trim()) {
      onConfirm(prompt.trim());
      setPrompt('');
    }
  };

  const handleCancel = () => {
    setPrompt('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            <Text style={styles.title}>Rewrite Task</Text>

            {/* Warning box */}
            <View style={styles.warningBox}>
              <AlertCircle size={20} color={colors.warning[600]} strokeWidth={1.5} />
              <Text style={styles.warningText}>
                This will replace ALL steps with new ones. This action cannot be undone.
              </Text>
            </View>

            <Text style={styles.message}>
              Tell us how you'd like to rewrite: "{taskTitle}"
            </Text>
            <TextInput
              placeholder="e.g., Make this more beginner-friendly"
              value={prompt}
              onChangeText={setPrompt}
              multiline={true}
              style={styles.input}
              autoCapitalize="sentences"
            />
            <View style={styles.actions}>
              <Button
                variant="secondary"
                size="medium"
                label="Cancel"
                onPress={handleCancel}
              />
              <Button
                variant="primary"
                size="medium"
                label="Rewrite Task"
                onPress={handleConfirm}
                disabled={!prompt.trim()}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    color: colors.gray.light[950],
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '600',
    lineHeight: 28,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: colors.warning[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  warningText: {
    flex: 1,
    color: colors.warning[800],
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
  },
  message: {
    color: colors.gray.light[600],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: String(typography.body.base.fontWeight) as any,
    lineHeight: typography.body.base.lineHeight,
  },
  input: {
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
