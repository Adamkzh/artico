import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, Alert, ImageBackground } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getArtwork } from '../../database/artworks';
import { getSessionsByArtwork } from '../../database/sessions';
import { addMessage, getMessagesBySession, Message } from '../../database/messages';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { useRole } from '../../utils/i18n/RoleContext';
import { generateResponse } from '../../services/chat';
import { Audio } from 'expo-av';
import { addSession } from '../../database/sessions';
import { deleteArtwork } from '../../database/artworks';
import { deleteImageFromFileSystem } from '../../utils/fileSystem';
import { BlurView } from 'expo-blur';

export default function ArtworkDetail() {
  const { id, from } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [artwork, setArtwork] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [shouldRenderImage, setShouldRenderImage] = useState(false);

  
  useEffect(() => {
    const loadArtwork = async () => {
      const artworkData = await getArtwork(id as string);
      if (artworkData) {
        if (artworkData?.image_uri) {
          try {
            await Image.prefetch(artworkData.image_uri);
            setShouldRenderImage(true);
          } catch (err) {
            console.warn("Prefetch failed:", err);
          }
        }
        setArtwork(artworkData);
        const sessions = await getSessionsByArtwork(artworkData.id);
        if (sessions.length > 0) {
          const messages = await getMessagesBySession(sessions[0].id);
          setMessages(messages);
        }
      }
    };
    loadArtwork();
  }, [id]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // Check if session exists first
      const existingSessions = await getSessionsByArtwork(artwork.id);
      let sessionId = artwork.session_id;

      if (!existingSessions.length) {
        const session = await addSession({
          artwork_id: artwork.id,
          session_id: artwork.session_id
        });
        sessionId = session.id;
        
        // Add initial description message
        await addMessage({
          session_id: sessionId,
          role: 'assistant',
          text: artwork.description
        });
        
        // Reload messages
        const updatedMessages = await getMessagesBySession(sessionId);
        setMessages(updatedMessages);
      }

      const userMessage: Omit<Message, 'id' | 'type' | 'created_at'> = {
        session_id: sessionId,
        role: 'user',
        text: inputText
      };

      setMessages(prev => [...prev, { ...userMessage, id: `msg_${Date.now()}`, type: 'message', created_at: Date.now() }]);
      setInputText('');

      // Get AI response
      const response = await generateResponse(sessionId, inputText);
      
      const assistantMessage: Omit<Message, 'id' | 'type' | 'created_at'> = {
        session_id: sessionId,
        role: 'assistant',
        text: response.text
      };

      await addMessage(assistantMessage);
      setMessages(prev => [...prev, { ...assistantMessage, id: `msg_${Date.now()}`, type: 'message', created_at: Date.now() }]);
      setIsAudioReady(true);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async (messageId: string, audioPath: string) => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioPath },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t('deleteArtwork'),
      t('deleteArtworkConfirm'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the artwork and all related data first
              await deleteArtwork(artwork.id);
              
              // Navigate back to home
              router.replace('/');
            } catch (error) {
              console.error('Error deleting artwork:', error);
              Alert.alert(t('error'), t('deleteArtworkError'));
            }
          }
        }
      ]
    );
  };

  if (!artwork) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <ImageBackground
        source={artwork.image_uri ? { uri: artwork.image_uri } : undefined}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <BlurView intensity={40} style={{ flex: 1 }}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <TouchableOpacity
              onPress={() => {
                if (from === 'loading') {
                  router.replace('/');
                } else {
                  router.back();
                }
              }}
            >
              <Ionicons
                name={from === 'loading' ? 'home-outline' : 'arrow-back'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <View style={styles.topNavRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/camera')}>
                <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={[styles.scrollSection, { backgroundColor: 'transparent' }]}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Artwork Image */}
              {artwork.image_uri && (
                <View style={styles.imageContainer}>
                  {shouldRenderImage ? (
                    <Image
                      source={{ uri: artwork.image_uri }}
                      style={styles.topImage}
                      resizeMode="cover"
                      onLoadStart={() => {
                        setIsImageLoaded(false);
                      }}
                      onLoadEnd={() => {
                        setIsImageLoaded(true);
                        setShouldRenderImage(true);
                      }}
                      onError={() => {
                        console.warn('Image failed to load.');
                        setIsImageLoaded(true);
                        setShouldRenderImage(false);
                      }}
                    />
                  ) : (
                    <View style={styles.imageLoadingContainer}>
                      <Text style={styles.imageLoadingText}>{t('loading')}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Title and Metadata Block */}
              <View style={[styles.metaBlock, {backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20}]}> 
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{artwork.title}</Text>
                  <View style={styles.artistRow}>
                    <Text style={styles.artistMeta} numberOfLines={1}>
                      {artwork.artist}
                    </Text>
                    <View style={styles.artistRight}>
                      {artwork.museum_logo_uri && (
                        <Image source={{ uri: artwork.museum_logo_uri }} style={styles.museumLogo} resizeMode="contain" />
                      )}
                      <TouchableOpacity
                        style={[
                          styles.titleAudioButton,
                          isAudioReady && styles.titleAudioButtonActive
                        ]}
                        onPress={() => {
                          if (!isAudioReady) return;
                          const messageWithAudio = messages.find(msg => msg.audio_path);
                          if (messageWithAudio) {
                            handlePlayPause(messageWithAudio.id, messageWithAudio.audio_path!);
                          }
                        }}
                      >
                        <Ionicons 
                          name={isPlaying ? "pause" : "play"} 
                          size={24} 
                          color={isAudioReady ? "#FFFFFF" : "#666666"} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.museumMeta}>{artwork.museum_name}</Text>
                  <Text style={styles.description}>{artwork.description}</Text>
                </View>
              </View>
              {/* Messages Section */}
              <View style={styles.messagesSection}>
                {messages.map((message) => (
                  <View key={message.id} style={styles.messageContainer}>
                    <Text style={styles.messageRole}>
                      {message.role === 'user' ? t('you') : t('assistant')}
                    </Text>
                    <Text style={styles.messageContent}>{message.text}</Text>
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
        </BlurView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    width: '85%',
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 20,
    marginTop: 120,
    marginBottom: 20,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  imageLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    paddingVertical: 20,
    position: 'absolute',
    top: Platform.select({ ios: 48, android: 24, default: 32 }),
    left: 0,
    right: 0,
    zIndex: 10,
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
    marginBottom: 2,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8,
  },
  artistMeta: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
    flex: 1,
    marginRight: 12,
  },
  artistRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  museumMeta: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 0,
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
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageRole: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  messageContent: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFFFFF',
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  metaBlock: {
    padding: 20,
    marginHorizontal: 20,
  },
  titleAudioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  titleAudioButtonActive: {
    backgroundColor: '#007AFF',
  },
  description: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    opacity: 0.9,
  },
}); 