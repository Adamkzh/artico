import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  audioPlaying: boolean;
}

const ResultScreen = () => {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  
  const initialMessage = "这幅画描绘的是《圣经·新约》中著名的场景——以马忤斯的晚餐。";

  useEffect(() => {
    typeMessage(initialMessage);
    
    // Cleanup function to stop any playing audio when component unmounts
    return () => {
      Speech.stop();
    };
  }, []);

  const typeMessage = (text: string) => {
    setIsTyping(true);
    let currentIndex = 0;
    const messageId = Date.now().toString();
    
    // Start playing audio immediately when typing begins
    playAudio(text, messageId);
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setCurrentMessage(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: messageId,
          text,
          isUser: false,
          audioPlaying: false
        }]);
        setCurrentMessage('');
      }
    }, 30);

    return () => clearInterval(typingInterval);
  };

  const playAudio = async (text: string, messageId: string) => {
    try {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, audioPlaying: true } : msg
      ));
      
      await Speech.speak(text, {
        language: 'zh',
        onStart: () => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, audioPlaying: true } : msg
          ));
        },
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
    } catch (error) {
      console.error('Error playing audio:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, audioPlaying: false } : msg
      ));
    }
  };

  const toggleAudio = async (message: Message) => {
    try {
      if (message.audioPlaying) {
        await Speech.stop();
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, audioPlaying: false } : msg
        ));
      } else {
        await playAudio(message.text, message.id);
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  const handleSendMessage = () => {
    if (userInput.trim()) {
      // Add user message
      const userMessage = userInput.trim();
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: userMessage,
        isUser: true,
        audioPlaying: false
      }]);
      
      // Clear input and hide keyboard
      setUserInput('');
      textInputRef.current?.blur();
      
      // Simulate a response after a short delay
      setTimeout(() => {
        typeMessage("画面上，耶稣坐在桌子中央，正掰开面包，象征着圣餐与救赎。左侧和右侧的门徒表情激动，身体微微前倾，传达出那一刻认出耶稣的惊讶与感动。");
      }, 1000);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => {
          Speech.stop();
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
          source={{ uri: imageUri }}
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
          placeholder="Ask me anything about this painting..."
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