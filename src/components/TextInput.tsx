import React, {useState} from 'react';
import {View, TextInput as RNTextInput, StyleSheet, TouchableOpacity} from 'react-native';
import {Eye, EyeOff} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

interface TextInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry;
  const actualSecureEntry = secureTextEntry && !isPasswordVisible;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={[
      styles.container,
      isFocused && styles.containerFocused,
    ]}>
      <View style={styles.inputWrapper}>
        <RNTextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray.light[400]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          secureTextEntry={actualSecureEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </View>
      {showPasswordToggle && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.eyeButton}>
          {isPasswordVisible ? (
            <EyeOff size={20} color={colors.gray.light[500]} strokeWidth={1.5} />
          ) : (
            <Eye size={20} color={colors.gray.light[500]} strokeWidth={1.5} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.gray.light[100],
    transition: 'border-color 0.2s ease',
  },
  containerFocused: {
    borderColor: colors.indigo[600],
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
  eyeButton: {
    padding: 4,
    cursor: 'pointer',
  },
});
