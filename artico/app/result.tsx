import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, TextInput, Keyboard, KeyboardEvent, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { getCollection } from '../database/collections';
import { Audio } from 'expo-av';
import { addSession, getSessionWithMessages, updateSessionMessages } from '../database/sessions';
import { Message as DBMessage } from '../database/messages';
import { v4 as uuidv4 } from 'uuid';

const { width } = Dimensions.get('window');

interface UIMessage {
  id: string;
  text: string;
  isUser: boolean;
  audioPlaying: boolean;
  audioUrl?: string;
}

interface ArtworkData {
  title: string;
  museum: string;
  imageUri: string;
  description: string;
  session_id?: string;
}

const convertDBMessageToUI = (dbMessage: DBMessage): UIMessage => ({
  id: dbMessage.id,
  text: dbMessage.text,
  isUser: dbMessage.role === 'user',
  audioPlaying: false,
  audioUrl: dbMessage.audio_path
});

const convertUIMessageToDB = (uiMessage: UIMessage, sessionId: string): Omit<DBMessage, 'created_at'> => ({
  id: uiMessage.id,
  type: 'message',
  session_id: sessionId,
  role: uiMessage.isUser ? 'user' : 'assistant',
  text: uiMessage.text,
  audio_path: uiMessage.audioUrl
});

const ResultScreen = () => {
  const router = useRouter();
  const { collectionId, sessionId: initialSessionId } = useLocalSearchParams<{ collectionId: string; sessionId?: string }>();
  const [sessionId, setSessionId] = useState<string>(initialSessionId || '');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [artworkData, setArtworkData] = useState<ArtworkData | null>(null);
  const [sound, setSound] = useState<Audio.Sound>();
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  
  useEffect(() => {
    const initializeSession = async () => {
      if (initialSessionId) {
        // Load existing session and messages
        const session = await getSessionWithMessages(initialSessionId);
        if (session && session.messages) {
          setSessionId(initialSessionId);
          setMessages(session.messages.map(convertDBMessageToUI));
        }
      } else {
        // Create new session
        await addSession({
          artwork_id: collectionId
        });
        const newSessionId = uuidv4();
        setSessionId(newSessionId);
      }
    };

    initializeSession();
  }, [collectionId, initialSessionId]);

  useEffect(() => {
    const fetchArtworkData = async () => {
      try {
        const collection = await getCollection(collectionId);
        if (collection) {
          setArtworkData({
            title: collection.title,
            museum: collection.museum_name,
            imageUri: collection.image_uri || '',
            description: collection.description || '',
            session_id: sessionId
          });
          
          // Start the initial message with artwork information
          if (collection.description) {
            typeMessage(collection.description);
          } else {
            typeMessage(`This is ${collection.title} from ${collection.museum_name}.`);
          }
        }
      } catch (error) {
        console.error('Error fetching artwork data:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: 'Error loading artwork information. Please try again.',
          isUser: false,
          audioPlaying: false
        }]);
      }
    };

    fetchArtworkData();
    
    return () => {
      Speech.stop();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [collectionId, sessionId]);

  const typeMessage = async (text: string, audioUrl?: string) => {
    setIsTyping(true);
    let currentIndex = 0;
    const messageId = uuidv4();
    
    const uiMessage: UIMessage = {
      id: messageId,
      text,
      isUser: false,
      audioPlaying: false,
      audioUrl
    };
    
    // Add message to database
    const dbMessage = convertUIMessageToDB(uiMessage, sessionId);
    const allMessages = [...messages.map(msg => ({
      ...convertUIMessageToDB(msg, sessionId),
      created_at: Date.now()
    })), {
      ...dbMessage,
      created_at: Date.now()
    }];
    await updateSessionMessages(sessionId, allMessages);
    
    playAudio(text, messageId, audioUrl);
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setCurrentMessage(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        setMessages(prev => [...prev, uiMessage]);
        setCurrentMessage('');
      }
    }, 30);

    return () => clearInterval(typingInterval);
  };

  const playAudio = async (text: string, messageId: string, audioUrl?: string) => {
    try {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, audioPlaying: true } : msg
      ));
  
      if (audioUrl) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        setSound(sound);
      } else {
        await Speech.speak(text, {
          language: 'en',
          onDone: () => {
            setMessages(prev => prev.map(msg =>
              msg.id === messageId ? { ...msg, audioPlaying: false } : msg
            ));
          },
          onError: (error) => {
            console.error('Speech error:', error);
            setMessages(prev => prev.map(msg =>
              msg.id === messageId ? { ...msg, audioPlaying: false } : msg
            ));
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, audioPlaying: false } : msg
      ));
    }
  };

  const toggleAudio = async (message: UIMessage) => {
    if (message.audioPlaying) {
      await Speech.stop();
      if (sound) {
        await sound.stopAsync();
      }
      setMessages(prev => prev.map(msg =>
        msg.id === message.id ? { ...msg, audioPlaying: false } : msg
      ));
    } else {
      await Speech.stop();
      if (sound) {
        await sound.stopAsync();
      }
      setMessages(prev => prev.map(msg => ({ ...msg, audioPlaying: false })));
      await playAudio(message.text, message.id, message.audioUrl);
    }
  };

  const handleSendMessage = async () => {
    if (userInput.trim()) {
      const userMessage = userInput.trim();
      const messageId = uuidv4();
      
      const uiMessage: UIMessage = {
        id: messageId,
        text: userMessage,
        isUser: true,
        audioPlaying: false
      };
      
      // Add user message to database
      const dbMessage = convertUIMessageToDB(uiMessage, sessionId);
      const allMessages = [...messages.map(msg => ({
        ...convertUIMessageToDB(msg, sessionId),
        created_at: Date.now()
      })), {
        ...dbMessage,
        created_at: Date.now()
      }];
      await updateSessionMessages(sessionId, allMessages);
      
      setMessages(prev => [...prev, uiMessage]);
      setUserInput('');
      textInputRef.current?.blur();
      
      // Simulate a response about the artwork
      setTimeout(() => {
        typeMessage("This artwork is a masterpiece that showcases the artist's unique style and technique. The composition and use of color create a powerful visual impact.");
      }, 1000);
    }
  };

  if (!artworkData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading artwork...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => {
          Speech.stop();
          if (sound) {
            sound.unloadAsync();
          }
          router.push('/');
        }}
      >
        <Ionicons name="home" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => textInputRef.current?.blur()}
      >
        <Image
          source={{ uri: artworkData.imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.contentContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
            {!message.isUser && (
              <TouchableOpacity
                style={styles.audioButton}
                onPress={() => toggleAudio(message)}
              >
                <Ionicons
                  name={message.audioPlaying ? 'pause' : 'play'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {isTyping && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{currentMessage}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.input}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="Ask me anything about this artwork..."
          placeholderTextColor="#666"
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!userInput.trim()}
        >
          <Ionicons name="send" size={24} color={userInput.trim() ? "#FFFFFF" : "#666"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  image: {
    width: width,
    height: Dimensions.get('window').height * 0.328,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    maxWidth: '85%',
    marginBottom: 10,
    padding: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  audioButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginRight: 10,
    color: '#FFFFFF',
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
    backgroundColor: '#2A2A2A',
  },
  homeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default ResultScreen; 