import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCollection } from '../../database/collections';
import { Message, getMessagesBySession } from '../../database/messages';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CollectionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [collection, setCollection] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

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
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id]);

  const handlePlayPause = async (messageId: string, audioPath: string) => {
    try {
      if (sound) {
        if (isPlaying === messageId) {
          const status = await sound.getStatusAsync();
          if ('isPlaying' in status && status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(null);
          } else {
            await sound.playAsync();
            setIsPlaying(messageId);
          }
          return;
        } else {
          await sound.unloadAsync();
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(null);
        }
      });

      setSound(newSound);
      setIsPlaying(messageId);
    } catch (error) {
      console.error('Error handling audio:', error);
    }
  };

  if (!collection) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {collection.image_uri && (
          <Image
            source={{ uri: collection.image_uri }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}
        
        <SafeAreaView style={styles.overlay}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.topNavRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Card and Messages */}
          <View style={styles.bottomSection}>
            <BlurView intensity={20} style={styles.infoCard}>
              <Text style={styles.title}>{collection.title}</Text>
              <View style={styles.museumInfo}>
                <Text style={styles.artist}>{collection.artist} • {collection.created_at}</Text>
                <Text style={styles.museum}>{collection.museum_name}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Messages Section */}
              <ScrollView style={styles.messagesSection}>
                {messages.map((message) => (
                  <View key={message.id} style={styles.messageContainer}>
                    <Text style={styles.messageRole}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
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
              </ScrollView>
            </BlurView>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: SCREEN_HEIGHT * 0.7,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  museumInfo: {
    marginBottom: 16,
  },
  artist: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 4,
  },
  museum: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
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
}); 