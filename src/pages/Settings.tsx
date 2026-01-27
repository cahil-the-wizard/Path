import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, TextInput as RNTextInput} from 'react-native';
import {User, X} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';
import {authService} from '../services/auth';
import {useNavigate} from 'react-router-dom';
import {TextInput} from '../components/TextInput';
import {Button} from '../components/Button';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    // Load user data from session
    const session = authService.getSession();
    if (session) {
      const userData = authService.getUserData();
      setName(userData.name || '');
      setEmail(userData.email || session.userId);
      setAvatarUrl(userData.avatarUrl || null);
    }
  }, []);

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
              <TouchableOpacity onPress={handleAvatarUpload}>
                {avatarUrl ? (
                  <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <User size={32} color={colors.gray.light[600]} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.username}>{email}</Text>
              <TouchableOpacity style={styles.changeButton} onPress={handleAvatarUpload}>
                <Text style={styles.changeButtonText}>Change avatar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Full Name */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Full Name</Text>
                {name && <Text style={styles.settingValue}>{name}</Text>}
              </View>
              <TouchableOpacity
                style={styles.settingRight}
                onPress={() => {
                  setEditingName(name);
                  setShowNameModal(true);
                }}>
                <Text style={styles.changeButtonText}>Change full name</Text>
              </TouchableOpacity>
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

        {/* System Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>

          <View style={styles.card}>
            {/* Support */}
            <TouchableOpacity style={styles.settingRow}>
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

            {/* Sign out of all sessions */}
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Sign out of all sessions</Text>
                <Text style={styles.settingDescription}>Devices or browsers where you are signed in</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.changeButtonText}>Sign out of all sessions</Text>
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
});
