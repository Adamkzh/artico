import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../utils/i18n/LanguageContext';

const languageOptions = [
  { id: 'zh', name: 'Chinese', label: '中文', flag: '🇨🇳' },
  { id: 'en', name: 'English', label: 'English', flag: '🇺🇸' },
  { id: 'fr', name: 'French', label: 'Français', flag: '🇫🇷' },
  { id: 'es', name: 'Spanish', label: 'Español', flag: '🇪🇸' },
  { id: 'it', name: 'Italian', label: 'Italiano', flag: '🇮🇹' },
  { id: 'de', name: 'German', label: 'Deutsch', flag: '🇩🇪' },
];

const ProfileScreen = () => {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState(language);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Profile Content */}
      <ScrollView style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#FFFFFF" />
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <TouchableOpacity style={styles.languageSelectButton} onPress={() => { setPendingLanguage(language); setModalVisible(true); }}>
            <Text style={styles.languageSelectText}>
              {languageOptions.find(l => l.id === language)?.flag} {languageOptions.find(l => l.id === language)?.label}
            </Text>
            <Ionicons name="chevron-up" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
        <View style={styles.bottomSheet}>
          <Text style={styles.sheetTitle}>{t('language')}</Text>
          <View style={styles.languageGrid}>
            {languageOptions.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={[styles.languageCell, pendingLanguage === lang.id && styles.languageCellSelected]}
                onPress={() => setPendingLanguage(lang.id as any)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={styles.languageName}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.doneButton} onPress={() => { if (pendingLanguage !== language) setLanguage(pendingLanguage as any); setModalVisible(false); }}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 120,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  languageSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 10,
  },
  languageSelectText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  languageCell: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  languageCellSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#e6f0ff',
  },
  flag: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  doneButton: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 