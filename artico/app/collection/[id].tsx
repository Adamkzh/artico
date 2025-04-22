import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCollection } from '../../database/collections';
import { Message, getMessagesBySession } from '../../database/messages';
import { Audio, AVPlaybackStatus } from 'expo-av';

export default function CollectionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [collection, setCollection] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null); // Store currently playing message id

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

    // Cleanup function to stop audio when leaving the page
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [id]);

  const handlePlayPause = async (messageId: string, audioPath: string) => {
    try {
      // If there's already a sound playing
      if (sound) {
        // If it's the same message that's currently playing
        if (isPlaying === messageId) {
          // Toggle pause/play
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
          // Stop the current sound if it's a different message
          await sound.unloadAsync();
        }
      }

      // Create and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { shouldPlay: true }
      );

      // When audio finishes playing
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
        <ScrollView style={styles.content}>
          {collection.image_uri && (
            <Image
              source={{ uri: collection.image_uri }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.infoContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>{collection.title}</Text>
            <Text style={styles.museum}>{collection.museum_name}</Text>
          </View>

          <View style={styles.conversationsContainer}>
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
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
  },
  infoContainer: {
    padding: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  museum: {
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.7,
    marginBottom: 10,
  },
  conversationsContainer: {
    padding: 20,
  },
  messageContainer: {
    backgroundColor: '#1A1A1A',
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
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  audioButtonPlaying: {
    backgroundColor: '#666666',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
}); 