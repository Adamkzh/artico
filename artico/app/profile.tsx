import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    { id: 'en', name: 'English' },
    { id: 'es', name: 'Spanish' },
    { id: 'fr', name: 'French' },
    { id: 'de', name: 'German' },
    { id: 'it', name: 'Italian' },
  ];

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
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.languageContainer}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.id}
                style={[
                  styles.languageButton,
                  selectedLanguage === language.name && styles.selectedLanguage,
                ]}
                onPress={() => setSelectedLanguage(language.name)}
              >
                <Text
                  style={[
                    styles.languageText,
                    selectedLanguage === language.name && styles.selectedLanguageText,
                  ]}
                >
                  {language.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333333',
  },
  selectedLanguage: {
    backgroundColor: '#FFFFFF',
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  selectedLanguageText: {
    color: '#000000',
  },
});

export default ProfileScreen; 