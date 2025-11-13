import React, {useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity} from 'react-native';
import {TextInput} from '../components/TextInput';
import {Button} from '../components/Button';
import {PasswordStrengthIndicator} from '../components/PasswordStrengthIndicator';
import {LogIn} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {useAuth} from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';

export const Auth: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
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
        const result = await signUp({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
        });

        // Check if email confirmation is required
        if (result.requiresEmailConfirmation) {
          setConfirmationEmail(result.email);
          setShowEmailConfirmation(true);
          setIsLoading(false);
          return;
        }

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

  // If showing email confirmation screen
  if (showEmailConfirmation) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <LogIn size={32} color={colors.indigo[600]} />
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We've sent a confirmation link to <Text style={styles.emailText}>{confirmationEmail}</Text>
              </Text>
            </View>

            <View style={styles.confirmationContent}>
              <Text style={styles.confirmationText}>
                Click the link in the email to verify your account and get started with Path.
              </Text>
              <Text style={styles.confirmationSubtext}>
                Didn't receive the email? Check your spam folder or contact support.
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Ready to sign in? </Text>
              <Text
                style={styles.footerLink}
                onPress={() => {
                  setShowEmailConfirmation(false);
                  setMode('signin');
                  setEmail('');
                  setPassword('');
                  setName('');
                }}>
                Sign in
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={{uri: '/assets/logo-expanded.svg'}}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Split Screen Container */}
      <View style={styles.splitContainer}>
        {/* Left Side - Form */}
        <View style={styles.leftPanel}>
          <View style={styles.formContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome to Path</Text>
              <Text style={styles.subtitle}>
                Your first step toward progress starts here.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Google Sign Up Button */}
              <TouchableOpacity style={styles.googleButton}>
                <Image
                  source={{uri: '/assets/google-icon.png'}}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleButtonText}>
                  {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Input */}
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />

              {/* Password Input */}
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.signUpButtonText}>
                  {mode === 'signup' ? 'Sign up' : 'Sign in'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {mode === 'signin'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isLoading) {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setName('');
                    setEmail('');
                    setPassword('');
                  }
                }}
                style={styles.footerLinkContainer}>
                <Text style={styles.footerLink}>
                  {mode === 'signin' ? 'Sign up' : 'Log in'}
                </Text>
                {mode === 'signup' && (
                  <Image
                    source={{uri: '/assets/underline-scribble.svg'}}
                    style={styles.underlineScribble}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right Side - Hero Image */}
        <View style={styles.rightPanel}>
          <Image
            source={{uri: '/assets/hero-mountain.png'}}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroText, {opacity: 0.3}]}>Big goals.</Text>
            <Text style={[styles.heroText, {opacity: 0.5}]}>Small steps.</Text>
            <Text style={[styles.heroText, {opacity: 0.8}]}>Find your path.</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100vh',
    backgroundColor: 'white',
    position: 'relative',
  },
  logo: {
    position: 'absolute',
    top: 32,
    left: 32,
    width: 120,
    height: 32,
    zIndex: 10,
  },
  splitContainer: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
  },
  leftPanel: {
    flex: 1,
    paddingLeft: 64,
    paddingRight: 32,
    paddingVertical: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 450,
    gap: 36,
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: typography.title.subtitle.fontFamily,
    fontWeight: '400',
    color: colors.gray.light[800],
    lineHeight: 38.4,
    letterSpacing: -0.64,
  },
  subtitle: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[700],
    lineHeight: typography.body.base.lineHeight,
  },
  form: {
    gap: 20,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: colors.gray.light[300],
    backgroundColor: 'white',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[950],
    lineHeight: typography.body.base.lineHeight,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray.light[300],
  },
  dividerText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[600],
    lineHeight: typography.body.small.lineHeight,
  },
  signUpButton: {
    backgroundColor: colors.indigo[500],
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: 'white',
    fontWeight: '400',
    lineHeight: typography.body.base.lineHeight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: 'black',
    lineHeight: typography.body.base.lineHeight,
  },
  footerLinkContainer: {
    position: 'relative',
  },
  footerLink: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: '600',
    color: 'black',
    lineHeight: typography.body.base.lineHeight,
  },
  underlineScribble: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    width: 72,
    height: 9,
  },
  rightPanel: {
    flex: 1,
    maxWidth: 714,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    marginLeft: 10,
    marginRight: 32,
    marginTop: 32,
    marginBottom: 32,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroTextContainer: {
    position: 'absolute',
    top: 64,
    left: 32,
    gap: 4,
    paddingLeft: 0,
  },
  heroText: {
    fontSize: 52,
    fontFamily: typography.title.subtitle.fontFamily,
    fontWeight: '400',
    color: colors.gray.light[25],
    lineHeight: 72.8,
    letterSpacing: -1.04,
  },
  // Email confirmation styles
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
  },
  emailText: {
    fontWeight: '600',
    color: colors.indigo[600],
  },
  confirmationContent: {
    width: '100%',
    gap: 16,
    paddingVertical: 24,
  },
  confirmationText: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[700],
    lineHeight: typography.body.base.lineHeight,
    textAlign: 'center',
  },
  confirmationSubtext: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[500],
    lineHeight: typography.body.small.lineHeight,
    textAlign: 'center',
  },
});
