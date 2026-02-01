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
  onSubmitEditing?: () => void;
  onKeyPress?: (e: any) => void;
  style?: any;
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
  onSubmitEditing,
  onKeyPress,
  style,
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
      style,
    ]}>
      <View style={styles.inputWrapper}>
        <RNTextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray.light[500]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          secureTextEntry={actualSecureEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmitEditing}
          onKeyPress={onKeyPress}
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
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gray.light[300],
    backgroundColor: 'white',
    transition: 'border-color 0.2s ease',
    minHeight: 44,
  },
  containerFocused: {
    borderColor: colors.green[500],
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
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
    minHeight: 24,
    maxHeight: 200,
  },
  eyeButton: {
    padding: 4,
    cursor: 'pointer',
  },
});
