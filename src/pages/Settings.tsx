import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput as RNTextInput, Switch, ActivityIndicator, Linking} from 'react-native';
import {User, X, ChevronDown} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {authService} from '../services/auth';
import {apiClient} from '../services/apiClient';
import {useNavigate} from 'react-router-dom';
import {TextInput} from '../components/TextInput';
import {Button} from '../components/Button';

// Common timezones for dropdown
const TIMEZONES = [
  {label: 'Eastern Time (ET)', value: 'America/New_York'},
  {label: 'Central Time (CT)', value: 'America/Chicago'},
  {label: 'Mountain Time (MT)', value: 'America/Denver'},
  {label: 'Pacific Time (PT)', value: 'America/Los_Angeles'},
  {label: 'Alaska Time (AKT)', value: 'America/Anchorage'},
  {label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu'},
  {label: 'London (GMT/BST)', value: 'Europe/London'},
  {label: 'Paris (CET/CEST)', value: 'Europe/Paris'},
  {label: 'Berlin (CET/CEST)', value: 'Europe/Berlin'},
  {label: 'Tokyo (JST)', value: 'Asia/Tokyo'},
  {label: 'Sydney (AEST/AEDT)', value: 'Australia/Sydney'},
  {label: 'Dubai (GST)', value: 'Asia/Dubai'},
  {label: 'Singapore (SGT)', value: 'Asia/Singapore'},
  {label: 'Hong Kong (HKT)', value: 'Asia/Hong_Kong'},
  {label: 'Mumbai (IST)', value: 'Asia/Kolkata'},
];

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState('');

  // Reminder preferences state
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [timezone, setTimezone] = useState('America/New_York');
  const [reminderHour, setReminderHour] = useState('7');
  const [reminderMinute, setReminderMinute] = useState('45');
  const [reminderPeriod, setReminderPeriod] = useState<'AM' | 'PM'>('AM');
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

  useEffect(() => {
    // Load user data from session
    const session = authService.getSession();
    if (session) {
      const userData = authService.getUserData();
      setName(userData.name || '');
      setEmail(userData.email || session.userId);
      setAvatarUrl(userData.avatarUrl || null);
    }

    // Load preferences from API
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const response = await apiClient.getPreferences();
      const prefs = response?.preferences;

      if (!prefs) {
        // Use defaults if no preferences returned
        console.log('No preferences found, using defaults');
        return;
      }

      setRemindersEnabled(prefs.daily_digest_enabled ?? true);
      setTimezone(prefs.timezone ?? 'America/New_York');

      // Convert 24h to 12h format
      const hour24 = prefs.preferred_reminder_hour ?? 7;
      if (hour24 === 0) {
        setReminderHour('12');
        setReminderPeriod('AM');
      } else if (hour24 === 12) {
        setReminderHour('12');
        setReminderPeriod('PM');
      } else if (hour24 > 12) {
        setReminderHour(String(hour24 - 12));
        setReminderPeriod('PM');
      } else {
        setReminderHour(String(hour24));
        setReminderPeriod('AM');
      }
      setReminderMinute(String(prefs.preferred_reminder_minute ?? 45).padStart(2, '0'));
    } catch (error) {
      console.error('Failed to load preferences:', error);
      // Keep defaults on error
    } finally {
      setLoadingPreferences(false);
    }
  };

  const updatePreference = async (updates: {
    daily_digest_enabled?: boolean;
    timezone?: string;
    preferred_reminder_hour?: number;
    preferred_reminder_minute?: number;
  }) => {
    try {
      setSavingPreferences(true);
      await apiClient.updatePreferences(updates);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleRemindersToggle = (value: boolean) => {
    setRemindersEnabled(value);
    updatePreference({daily_digest_enabled: value});
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    setShowTimezoneDropdown(false);
    updatePreference({timezone: value});
  };

  const handleTimeChange = (hour: string, minute: string, period: 'AM' | 'PM') => {
    // Convert 12h to 24h format
    let hour24 = parseInt(hour, 10);
    if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }

    const minute24 = parseInt(minute, 10);

    if (!isNaN(hour24) && !isNaN(minute24) && hour24 >= 0 && hour24 <= 23 && minute24 >= 0 && minute24 <= 59) {
      updatePreference({
        preferred_reminder_hour: hour24,
        preferred_reminder_minute: minute24,
      });
    }
  };

  const getTimezoneLabel = (value: string) => {
    return TIMEZONES.find(tz => tz.value === value)?.label || value;
  };

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/auth/login');
  };

  const handleSaveName = () => {
    authService.updateUserData({name: editingName});
    setName(editingName);
    setShowNameModal(false);
  };

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setAvatarUrl(dataUrl);
          authService.updateUserData({avatarUrl: dataUrl});
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        {/* Header */}
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            {/* Profile Picture */}
            <View style={styles.profileSection}>
              {avatarUrl ? (
                <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <User size={32} color={colors.gray.light[600]} />
                </View>
              )}
              <Text style={styles.username}>{email}</Text>
            </View>

            <View style={styles.divider} />

            {/* Full Name - display only */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Full Name</Text>
                {name && <Text style={styles.settingValue}>{name}</Text>}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Email */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingValue}>{email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.card}>
            {loadingPreferences ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.green[600]} />
              </View>
            ) : (
              <>
                {/* Enable Reminders Toggle */}
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>Enable Reminders</Text>
                    <Text style={styles.settingDescription}>
                      Receive daily reminders about your tasks
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Switch
                      value={remindersEnabled}
                      onValueChange={handleRemindersToggle}
                      trackColor={{false: colors.gray.light[300], true: colors.green[500]}}
                      thumbColor="white"
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Timezone */}
                <View style={[styles.settingRow, !remindersEnabled && styles.settingDisabled]}>
                  <View style={styles.settingLeft}>
                    <Text style={[styles.settingLabel, !remindersEnabled && styles.textDisabled]}>
                      Time Zone
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    <TouchableOpacity
                      style={[styles.dropdownButton, !remindersEnabled && styles.dropdownButtonDisabled]}
                      onPress={() => remindersEnabled && setShowTimezoneDropdown(!showTimezoneDropdown)}
                      disabled={!remindersEnabled}
                    >
                      <Text style={[styles.dropdownButtonText, !remindersEnabled && styles.textDisabled]}>
                        {getTimezoneLabel(timezone)}
                      </Text>
                      <ChevronDown size={16} color={remindersEnabled ? colors.gray.light[600] : colors.gray.light[400]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Timezone Dropdown */}
                {showTimezoneDropdown && (
                  <View style={styles.dropdownList}>
                    {TIMEZONES.map(tz => (
                      <TouchableOpacity
                        key={tz.value}
                        style={[
                          styles.dropdownItem,
                          timezone === tz.value && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleTimezoneChange(tz.value)}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            timezone === tz.value && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {tz.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.divider} />

                {/* Reminder Time */}
                <View style={[styles.settingRow, !remindersEnabled && styles.settingDisabled]}>
                  <View style={styles.settingLeft}>
                    <Text style={[styles.settingLabel, !remindersEnabled && styles.textDisabled]}>
                      Reminder Time
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    <View style={styles.timeInputContainer}>
                      <RNTextInput
                        style={[styles.timeInput, !remindersEnabled && styles.timeInputDisabled]}
                        value={reminderHour}
                        onChangeText={(text) => {
                          const num = text.replace(/[^0-9]/g, '');
                          if (num === '' || (parseInt(num, 10) >= 1 && parseInt(num, 10) <= 12)) {
                            setReminderHour(num);
                          }
                        }}
                        onBlur={() => {
                          if (reminderHour) {
                            handleTimeChange(reminderHour, reminderMinute, reminderPeriod);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        editable={remindersEnabled}
                        placeholder="7"
                        placeholderTextColor={colors.gray.light[400]}
                      />
                      <Text style={[styles.timeSeparator, !remindersEnabled && styles.textDisabled]}>:</Text>
                      <RNTextInput
                        style={[styles.timeInput, !remindersEnabled && styles.timeInputDisabled]}
                        value={reminderMinute}
                        onChangeText={(text) => {
                          const num = text.replace(/[^0-9]/g, '');
                          if (num === '' || (parseInt(num, 10) >= 0 && parseInt(num, 10) <= 59)) {
                            setReminderMinute(num.padStart(2, '0'));
                          }
                        }}
                        onBlur={() => {
                          if (reminderMinute) {
                            setReminderMinute(reminderMinute.padStart(2, '0'));
                            handleTimeChange(reminderHour, reminderMinute, reminderPeriod);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        editable={remindersEnabled}
                        placeholder="45"
                        placeholderTextColor={colors.gray.light[400]}
                      />
                      <View style={styles.periodToggle}>
                        <TouchableOpacity
                          style={[
                            styles.periodButton,
                            reminderPeriod === 'AM' && styles.periodButtonActive,
                            !remindersEnabled && styles.periodButtonDisabled,
                          ]}
                          onPress={() => {
                            if (remindersEnabled) {
                              setReminderPeriod('AM');
                              handleTimeChange(reminderHour, reminderMinute, 'AM');
                            }
                          }}
                          disabled={!remindersEnabled}
                        >
                          <Text
                            style={[
                              styles.periodButtonText,
                              reminderPeriod === 'AM' && styles.periodButtonTextActive,
                              !remindersEnabled && styles.textDisabled,
                            ]}
                          >
                            AM
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.periodButton,
                            reminderPeriod === 'PM' && styles.periodButtonActive,
                            !remindersEnabled && styles.periodButtonDisabled,
                          ]}
                          onPress={() => {
                            if (remindersEnabled) {
                              setReminderPeriod('PM');
                              handleTimeChange(reminderHour, reminderMinute, 'PM');
                            }
                          }}
                          disabled={!remindersEnabled}
                        >
                          <Text
                            style={[
                              styles.periodButtonText,
                              reminderPeriod === 'PM' && styles.periodButtonTextActive,
                              !remindersEnabled && styles.textDisabled,
                            ]}
                          >
                            PM
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {savingPreferences && (
                  <View style={styles.savingIndicator}>
                    <ActivityIndicator size="small" color={colors.green[600]} />
                    <Text style={styles.savingText}>Saving...</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* System Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>

          <View style={styles.card}>
            {/* Support */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => Linking.openURL('mailto:support@totallywizard.dev')}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Support</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.changeButtonText}>Contact</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Sign out */}
            <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Sign out</Text>
                <Text style={styles.settingDescription}>You are signed in</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.signOutButtonText}>Sign out</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Delete account */}
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Delete account</Text>
                <Text style={styles.settingDescription}>Permanently delete your account and data</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.changeButtonText}>Learn more</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>

    {/* Name Edit Modal */}
    {showNameModal && (
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowNameModal(false)}>
        <TouchableOpacity
          style={styles.modal}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change full name</Text>
            <TouchableOpacity onPress={() => setShowNameModal(false)}>
              <X size={20} color={colors.gray.light[600]} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              placeholder="Enter your name"
              value={editingName}
              onChangeText={setEditingName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.modalFooter}>
            <Button
              variant="secondary"
              size="medium"
              label="Cancel"
              onPress={() => setShowNameModal(false)}
            />
            <Button
              variant="primary"
              size="medium"
              label="Save"
              onPress={handleSaveName}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray.light[50],
  },
  content: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    padding: 40,
  },
  pageTitle: {
    fontSize: 32,
    fontFamily: typography.heading.subheading.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[900],
    marginBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[600],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
    overflow: 'hidden',
  },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray.light[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  username: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[700],
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.gray.light[100],
  },
  changeButtonText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[700],
    fontWeight: '500',
  },
  signOutButtonText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[700],
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray.light[200],
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    minHeight: 60,
  },
  settingLeft: {
    flex: 1,
    gap: 4,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    color: colors.gray.light[900],
    fontWeight: '500',
  },
  settingValue: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[600],
  },
  settingDescription: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[500],
  },
  modalOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light[200],
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[900],
  },
  modalBody: {
    padding: 20,
    gap: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light[200],
  },
  label: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: '600',
    color: colors.gray.light[700],
  },
  // Notification settings styles
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: colors.gray.light[400],
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.gray.light[100],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
  },
  dropdownButtonDisabled: {
    backgroundColor: colors.gray.light[50],
    borderColor: colors.gray.light[200],
  },
  dropdownButtonText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[700],
  },
  dropdownList: {
    backgroundColor: colors.gray.light[50],
    borderTopWidth: 1,
    borderTopColor: colors.gray.light[200],
    maxHeight: 250,
    overflow: 'scroll' as any,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light[100],
  },
  dropdownItemSelected: {
    backgroundColor: colors.green[50],
  },
  dropdownItemText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[700],
  },
  dropdownItemTextSelected: {
    color: colors.green[700],
    fontWeight: '600',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInput: {
    width: 44,
    height: 36,
    backgroundColor: colors.gray.light[100],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter',
    color: colors.gray.light[900],
    // @ts-ignore
    outlineStyle: 'none',
  },
  timeInputDisabled: {
    backgroundColor: colors.gray.light[50],
    color: colors.gray.light[400],
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray.light[600],
    marginHorizontal: 2,
  },
  periodToggle: {
    flexDirection: 'row',
    marginLeft: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
    overflow: 'hidden',
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.gray.light[100],
  },
  periodButtonActive: {
    backgroundColor: colors.green[500],
  },
  periodButtonDisabled: {
    backgroundColor: colors.gray.light[50],
  },
  periodButtonText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: colors.gray.light[600],
  },
  periodButtonTextActive: {
    color: 'white',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light[200],
  },
  savingText: {
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    color: colors.gray.light[500],
  },
});
