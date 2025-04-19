import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const { width } = Dimensions.get('window');

const ResultScreen = () => {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [displayedText, setDisplayedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fullText = "This is a beautiful artwork that showcases the artist's mastery of color and composition. The piece demonstrates a perfect balance between light and shadow, creating a sense of depth and dimension. The brushstrokes are expressive yet controlled, revealing the artist's technical skill and emotional depth.";

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, []);

  const toggleSpeech = async () => {
    if (isSpeaking) {
      await Speech.stop();
    } else {
      await Speech.speak(fullText, {
        language: 'en',
        onDone: () => setIsSpeaking(false),
      });
    }
    setIsSpeaking(!isSpeaking);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
      />

      <ScrollView style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.text}>{displayedText}</Text>
        </View>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.speechButton}
          onPress={toggleSpeech}
        >
          <Ionicons
            name={isSpeaking ? 'pause' : 'play'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/')}
        >
          <Ionicons name="home" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: width,
    height: width,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  textContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  speechButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResultScreen; 