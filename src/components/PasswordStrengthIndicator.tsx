import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, typography} from '../theme/tokens';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  checks: {
    hasLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

const calculatePasswordStrength = (password: string): StrengthResult => {
  const checks = {
    hasLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let label = 'Weak';
  let color = colors.error[500];

  if (score >= 5) {
    label = 'Strong';
    color = colors.success[500];
  } else if (score >= 3) {
    label = 'Medium';
    color = colors.warning[500];
  }

  return { score, label, color, checks };
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
}) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Good Password</Text>

      <View style={styles.barContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.bar,
              index < Math.min(strength.score - 1, 3) && { backgroundColor: strength.color },
            ]}
          />
        ))}
      </View>

      <Text style={styles.subtitle}>It's better to have:</Text>

      <View style={styles.requirements}>
        <RequirementItem
          met={strength.checks.hasUppercase && strength.checks.hasLowercase}
          text="Upper & lower case letters"
        />
        <RequirementItem
          met={strength.checks.hasSpecial}
          text="A symbol (#$&)"
        />
        <RequirementItem
          met={strength.checks.hasLength}
          text="A longer password"
        />
      </View>
    </View>
  );
};

const RequirementItem: React.FC<{ met: boolean; text: string }> = ({
  met,
  text,
}) => (
  <View style={styles.requirement}>
    <View style={[styles.icon, met && styles.iconMet]}>
      {met && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[900],
  },
  subtitle: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[600],
    marginTop: -8,
  },
  barContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  bar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray.light[200],
    borderRadius: 3,
  },
  requirements: {
    gap: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.gray.light[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconMet: {
    backgroundColor: colors.success[500],
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  requirementText: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[700],
    textDecorationLine: 'none',
  },
  requirementTextMet: {
    color: colors.gray.light[400],
    textDecorationLine: 'line-through',
  },
});
