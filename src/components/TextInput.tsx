import React from 'react';
import {View, TextInput as RNTextInput, StyleSheet} from 'react-native';
import {colors, typography} from '../theme/tokens';

interface TextInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  multiline = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <RNTextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray.light[400]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    color: colors.gray.light[950],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: String(typography.body.base.fontWeight) as any,
    lineHeight: typography.body.base.lineHeight,
    outlineStyle: 'none',
  },
});
