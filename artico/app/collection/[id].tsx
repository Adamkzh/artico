import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCollection, deleteCollection } from '../../database/collections';
import { Message, getMessagesBySession, addMessage } from '../../database/messages';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { BlurView } from 'expo-blur';
import { generateResponse } from '../../services/chat';
import { useLanguage } from '../../utils/i18n/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INFO_CARD_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function CollectionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [collection, setCollection] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCollection = async () => {
      if (typeof id === 'string') {
        const collectionData = await getCollection(id);
        if (collectionData) {
          setCollection(collectionData);
          const messagesData = await getMessagesBySession(collectionData.session_id);
          setMessages(messagesData);
        }
      }
    };

    loadCollection();

    return () => {
      // Cleanup audio when leaving the page
      if (sound) {
        sound.unloadAsync();
        setSound(null);
        setIsPlaying(null);
      }
    };
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      t('deleteCollection'),
      t('deleteCollectionConfirm'),
      [
        {
          text: t('cancel'),
          style: "cancel"
        },
        {
          text: t('delete'),
          style: "destructive",
          onPress: async () => {
            if (typeof id === 'string') {
              await deleteCollection(id);
              router.back();
            }
          }
        }
      ]
    );
  };

  const handlePlayPause = async (messageId: string, audioPath: string) => {
    try {
      // If there's a currently playing sound, stop it first
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(null);
      }

      // If clicking the same message that's already playing, just stop it
      if (isPlaying === messageId) {
        return;
      }

      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(null);
          setSound(null);
        }
      });

      setSound(newSound);
      setIsPlaying(messageId);
    } catch (error) {
      console.error('Error handling audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !collection) return;

    setIsLoading(true);
    try {
      // Add user message
      const userMessage = await addMessage({
        session_id: collection.session_id,
        role: 'user',
        text: inputText.trim()
      });
      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      // Generate and add assistant response
      const response = await generateResponse(collection.session_id, inputText.trim());
      const assistantMessage = await addMessage({
        session_id: collection.session_id,
        role: 'assistant',
        text: response.text,
        audio_path: response.audio_url
      });
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!collection) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topNavRight}>
            <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/')}
            >
              <Ionicons name="home-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Artwork Image at the Top */}
        {collection.image_uri && (
          <Image
            source={{ uri: collection.image_uri }}
            style={styles.topImage}
            resizeMode="cover"
          />
        )}

        {/* Title and Metadata Block */}
        <View style={styles.metaBlock}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{collection.title}</Text>
            <Text style={styles.artistMeta}>
              {collection.artist}
              {collection.created_at ? ` • ${collection.created_at}` : ''}
            </Text>
            <Text style={styles.museumMeta}>{collection.museum_name}</Text>
          </View>
          {/* Example: If you have a museum logo uri, display it here */}
          {collection.museum_logo_uri && (
            <Image source={{ uri: collection.museum_logo_uri }} style={styles.museumLogo} resizeMode="contain" />
          )}
        </View>

        {/* Messages Section */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={[styles.scrollSection, { backgroundColor: '#000' }]}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={styles.messagesSection}>
              {messages.map((message) => (
                <View key={message.id} style={styles.messageContainer}>
                  <Text style={styles.messageRole}>
                    {message.role === 'user' ? t('you') : t('assistant')}
                  </Text>
                  <Text style={styles.messageContent}>{message.text}</Text>
                  {message.audio_path && (
                    <TouchableOpacity
                      style={[
                        styles.audioButton,
                        isPlaying === message.id && styles.audioButtonPlaying
                      ]}
                      onPress={() => handlePlayPause(message.id, message.audio_path!)}
                    >
                      <Ionicons 
                        name={isPlaying === message.id ? "pause" : "play"} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Input Section */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('askAboutArtwork')}
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons 
                name="send" 
                size={24} 
                color={!inputText.trim() || isLoading ? "#666" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topImage: {
    width: '90%',
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#222',
  },
  scrollSection: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artistMeta: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 2,
  },
  museumMeta: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
  },
  museumLogo: {
    width: 48,
    height: 48,
    marginLeft: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionButton: {
    marginRight: 20,
  },
  messagesSection: {
    flex: 1,
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  messageRole: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  messageContent: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  audioButtonPlaying: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  metaBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
}); 