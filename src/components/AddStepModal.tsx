import React, {useState} from 'react';
import {View, Text, StyleSheet, Modal, Pressable} from 'react-native';
import {TextInput} from './TextInput';
import {Button} from './Button';
import {colors, typography} from '../theme/tokens';

interface AddStepModalProps {
  visible: boolean;
  onConfirm: (prompt: string) => void;
  onCancel: () => void;
}

export const AddStepModal: React.FC<AddStepModalProps> = ({
  visible,
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
            <Text style={styles.title}>Add New Step</Text>
            <Text style={styles.message}>
              Describe the step you'd like to add
            </Text>
            <TextInput
              placeholder="e.g., Research company culture"
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
                label="Add Step"
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
