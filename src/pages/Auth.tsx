import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity, Animated, useWindowDimensions, Linking} from 'react-native';
import {TextInput} from '../components/TextInput';
import {Button} from '../components/Button';
import {Toast} from '../components/Toast';
import {PasswordStrengthIndicator} from '../components/PasswordStrengthIndicator';
import {LogIn} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {useAuth} from '../contexts/AuthContext';
import {useNavigate, useLocation} from 'react-router-dom';
import {analytics} from '../services/analytics';

const REMEMBERED_EMAIL_KEY = 'remembered_email';

export const Auth: React.FC = () => {
  const location = useLocation();
  const mode: 'signin' | 'signup' = location.pathname === '/auth/login' ? 'signin' : 'signup';
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [showAccountExistsToast, setShowAccountExistsToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorToastMessage, setErrorToastMessage] = useState('');
  const navigate = useNavigate();
  const {signIn, signUp, updateUserData} = useAuth();
  const {width} = useWindowDimensions();
  const isMobile = width < 768;

  // Animation values for hero text
  const fadeAnim1 = useState(() => new Animated.Value(0))[0];
  const fadeAnim2 = useState(() => new Animated.Value(0))[0];
  const fadeAnim3 = useState(() => new Animated.Value(0))[0];
  const translateY1 = useState(() => new Animated.Value(20))[0];
  const translateY2 = useState(() => new Animated.Value(20))[0];
  const translateY3 = useState(() => new Animated.Value(20))[0];

  useEffect(() => {
    // Animate each text line with staggered timing
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnim1, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY1, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY2, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim3, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateY3, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      analytics.track(mode === 'signup' ? 'signup_validation_failed' : 'signin_validation_failed', {
        reason: 'missing_required_fields',
      });
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      analytics.track('signup_validation_failed', {reason: 'missing_name'});
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    // Track attempt
    analytics.track(mode === 'signup' ? 'signup_attempted' : 'signin_attempted');

    // Remember email for future visits
    try {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
    } catch {}

    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const result = await signUp({
          email: email.trim(),
          password: password.trim(),
          name: name.trim(),
        });

        // Check if account already exists
        if (result.accountAlreadyExists) {
          console.log('Account already exists - showing toast');
          analytics.track('signup_account_exists');
          setShowAccountExistsToast(true);
          setIsLoading(false);
          return;
        }

        // Check if email confirmation is required
        if (result.requiresEmailConfirmation) {
          analytics.track('signup_email_confirmation_required');
          setConfirmationEmail(result.email);
          setShowEmailConfirmation(true);
          setIsLoading(false);
          return;
        }

        // Save user profile data
        analytics.track('signup_succeeded');
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
        analytics.track('signin_succeeded');
        console.log('Signed in successfully, session:', session.userId);
        // Clear remembered email after successful login
        try {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        } catch {}
        // Save email to profile data
        updateUserData({
          email: email.trim(),
        });
        // Navigate immediately - auth state is now synchronized!
        navigate('/');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      const errorCode = (error as any)?.code;

      if (mode === 'signup') {
        analytics.track('signup_failed', {error: errorMessage});
        setErrorToastMessage(errorMessage);
        setShowErrorToast(true);
      } else if (errorCode === 'email_not_confirmed') {
        analytics.track('signin_email_not_confirmed');
        // Show email confirmation screen for unverified accounts
        setConfirmationEmail(email.trim());
        setShowEmailConfirmation(true);
      } else {
        analytics.track('signin_failed', {error: errorMessage, error_code: errorCode});
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email confirmation content (shown on left side, replacing form)
  const renderEmailConfirmation = () => (
    <View style={styles.confirmationWrapper}>
      <View style={styles.confirmationContainer}>
        <View style={styles.confirmationTextContainer}>
          <Text style={styles.confirmationTitle}>Check your inbox</Text>
          <Text style={styles.confirmationDescription}>
            We've sent a confirmation link to{' '}
            <Text style={styles.confirmationEmail}>{confirmationEmail}</Text>. Click the link to
            verify your Path account.
          </Text>
          <Text style={styles.confirmationSubtext}>
            Didn't receive the email? Check your spam folder or{' '}
            <Text
              style={styles.confirmationLink}
              onPress={() => Linking.openURL('mailto:support@totallywizard.dev')}
            >
              contact support
            </Text>.
          </Text>
        </View>
      </View>

      <View style={styles.confirmationFooter}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity
          onPress={() => {
            setShowEmailConfirmation(false);
            navigate('/auth/login');
            setPassword('');
            setName('');
            // Keep email
          }}
          style={styles.footerLinkContainer}>
          <Text style={styles.footerLink}>Log in</Text>
          <Image
            source={{uri: '/assets/underline-scribble-02.svg'}}
            style={styles.underlineScribble}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={{uri: '/assets/logo-expanded.svg'}}
        style={[styles.logo, isMobile && styles.logoMobile]}
        resizeMode="contain"
      />

      {/* Split Screen Container */}
      <View style={[styles.splitContainer, isMobile && styles.splitContainerMobile]}>
        {/* Left Side - Form or Confirmation */}
        <View style={[styles.leftPanel, isMobile && styles.leftPanelMobile, {position: 'relative'}]}>
          {showEmailConfirmation ? (
            renderEmailConfirmation()
          ) : (
            <View style={styles.formContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {mode === 'signin' ? 'Welcome back' : 'Welcome to Path'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'signin'
                  ? 'Sign in to continue your journey.'
                  : 'Your first step toward progress starts here.'}
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

              {/* Name Input - only for signup */}
              {mode === 'signup' && (
                <TextInput
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                  onSubmitEditing={() => {
                    // Focus email input or submit if it's the last field
                  }}
                />
              )}

              {/* Email Input */}
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                onSubmitEditing={() => {
                  // Focus password input
                }}
              />

              {/* Password Input */}
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                onSubmitEditing={handleAuth}
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
                    const targetPath = mode === 'signin' ? '/auth/signup' : '/auth/login';
                    navigate(targetPath);
                    setName('');
                    setPassword('');
                    // Keep email - don't clear it when switching modes
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
          )}

          {/* Toast Notification - positioned within left panel */}
          <Toast
            visible={showAccountExistsToast}
            message="You already have an account."
            actionText="Log in"
            onAction={() => {
              setShowAccountExistsToast(false);
              navigate('/auth/login');
              // Email already in state, no need to pass it
            }}
            onClose={() => setShowAccountExistsToast(false)}
          />
          <Toast
            visible={showErrorToast}
            message={errorToastMessage}
            onClose={() => setShowErrorToast(false)}
          />
        </View>

        {/* Right Side - Hero Image */}
        {!isMobile && (
        <View style={styles.rightPanel}>
          <Image
            source={{uri: '/assets/hero-mountain.png'}}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroTextContainer}>
            <Animated.Text
              style={[
                styles.heroText,
                {
                  opacity: fadeAnim1,
                  transform: [{translateY: translateY1}]
                }
              ]}>
              Big goals.
            </Animated.Text>
            <Animated.Text
              style={[
                styles.heroText,
                {
                  opacity: fadeAnim2,
                  transform: [{translateY: translateY2}]
                }
              ]}>
              Small steps.
            </Animated.Text>
            <Animated.Text
              style={[
                styles.heroText,
                {
                  opacity: fadeAnim3,
                  transform: [{translateY: translateY3}]
                }
              ]}>
              Find your path.
            </Animated.Text>
          </View>
        </View>
        )}
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
    '@media (max-width: 768px)': {
      top: 20,
      left: 20,
      width: 100,
      height: 27,
    },
  },
  splitContainer: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    },
  },
  leftPanel: {
    flex: 1,
    paddingLeft: 64,
    paddingRight: 32,
    paddingVertical: 64,
    justifyContent: 'center',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      paddingLeft: 20,
      paddingRight: 20,
      paddingVertical: 32,
    },
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
    backgroundColor: colors.green[500],
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
    bottom: -9,
    left: -4,
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
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroTextContainer: {
    position: 'absolute',
    top: 64,
    left: 64,
    gap: -4,
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
  confirmationWrapper: {
    width: '100%',
    maxWidth: 450,
    height: '100%',
    justifyContent: 'space-between',
  },
  confirmationContainer: {
    width: '100%',
    gap: 36,
    flex: 1,
    justifyContent: 'center',
  },
  confirmationTextContainer: {
    gap: 12,
  },
  confirmationTitle: {
    fontSize: 32,
    fontFamily: typography.title.subtitle.fontFamily,
    fontWeight: '400',
    color: colors.gray.light[800],
    lineHeight: 38.4,
    letterSpacing: -0.64,
  },
  confirmationDescription: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[700],
    lineHeight: typography.body.base.lineHeight,
  },
  confirmationEmail: {
    fontWeight: '600',
    color: colors.green[600],
  },
  confirmationSubtext: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[500],
    lineHeight: typography.body.base.lineHeight,
  },
  confirmationLink: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
  },
  confirmationFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 62,
  },
  logoMobile: {
    top: 20,
    left: 20,
    width: 100,
    height: 27,
  },
  splitContainerMobile: {
    flexDirection: 'column',
  },
  leftPanelMobile: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingVertical: 32,
  },
});
