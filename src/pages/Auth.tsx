import React, {useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import {TextInput} from '../components/TextInput';
import {Button} from '../components/Button';
import {PasswordStrengthIndicator} from '../components/PasswordStrengthIndicator';
import {LogIn} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {useAuth} from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const navigate = useNavigate();
  const {signIn, signUp, updateUserData} = useAuth();

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        await signUp({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
        });
        // Save user profile data
        updateUserData({
          name: name.trim(),
          email: email.trim(),
        });
        Alert.alert('Success', 'Account created! Welcome to Path.', [
          {
            text: 'OK',
            onPress: () => navigate('/'),
          },
        ]);
      } else {
        const session = await signIn({
          email: email.trim(),
          password: password.trim(),
        });
        console.log('Signed in successfully, session:', session.userId);
        // Save email to profile data
        updateUserData({
          email: email.trim(),
        });
        // Navigate immediately - auth state is now synchronized!
        navigate('/');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Authentication failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.header}>
            <LogIn size={32} color={colors.indigo[600]} />
            <Text style={styles.title}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'Sign in to continue your path'
                : 'Start breaking down your tasks'}
            </Text>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputWrapper, showPasswordStrength && styles.inputWrapperElevated]}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => {
                  if (mode === 'signup' && password.length > 0) {
                    setShowPasswordStrength(true);
                  }
                }}
                onBlur={() => setShowPasswordStrength(false)}
                secureTextEntry
                editable={!isLoading}
              />
              {showPasswordStrength && mode === 'signup' && (
                <View style={styles.passwordStrengthPopover}>
                  <PasswordStrengthIndicator password={password} />
                </View>
              )}
            </View>

            <Button
              variant="primary"
              size="large"
              label={isLoading ? '' : mode === 'signin' ? 'Sign in' : 'Sign up'}
              onPress={handleAuth}
              disabled={isLoading}
            />

            {isLoading && (
              <ActivityIndicator
                size="small"
                color={colors.indigo[600]}
                style={styles.loader}
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {mode === 'signin'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </Text>
            <Text
              style={styles.footerLink}
              onPress={() => {
                if (!isLoading) {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setName('');
                  setEmail('');
                  setPassword('');
                }
              }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100vh',
    backgroundColor: colors.gray.light[50],
  },
  content: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.heading.subheading.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[900],
    marginTop: 16,
  },
  subtitle: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[600],
    marginTop: 8,
  },
  form: {
    width: '100%',
    gap: 20,
    overflow: 'visible',
  },
  inputWrapper: {
    width: '100%',
    gap: 8,
    position: 'relative',
  },
  inputWrapperElevated: {
    zIndex: 100,
  },
  passwordStrengthPopover: {
    position: 'absolute',
    top: 0,
    right: '100%',
    marginRight: 16,
    width: 340,
    zIndex: 1000,
  },
  label: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[700],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[600],
  },
  footerLink: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: '600',
    color: colors.indigo[600],
  },
  loader: {
    marginTop: -48,
  },
});
