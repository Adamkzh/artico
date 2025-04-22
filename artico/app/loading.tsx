import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { identifyArtwork } from '../services/artwork';
import { addCollection } from '../database/collections';
import { addSession } from '../database/sessions';
import { addMessage } from '../database/messages';
import { saveImageToFileSystem, saveAudioToFileSystem } from '../utils/fileSystem';

const LoadingScreen = () => {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [blurAnim] = useState(new Animated.Value(100));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [status, setStatus] = useState('Identifying artwork...');

  useEffect(() => {
    const processArtwork = async () => {
      try {
        setStatus('Identifying artwork...');
        const artworkInfo = await identifyArtwork(imageUri);

        setStatus('Saving image...');
        const savedImageUri = await saveImageToFileSystem(imageUri);

        setStatus('Creating session...');
        const session = await addSession({
          artwork_id: artworkInfo.session_id,
        });

        setStatus('Saving audio...');
        const savedAudioUri = artworkInfo.audio_description_url 
          ? await saveAudioToFileSystem(artworkInfo.audio_description_url)
          : null;

        setStatus('Initializing conversation...');
        await addMessage({
          session_id: session.id,
          role: 'assistant',
          text: artworkInfo.description,
          audio_path: savedAudioUri || undefined
        });
        
        setStatus('Saving to collection...');
        const collection = await addCollection({
          museum_name: artworkInfo.museum_name,
          title: artworkInfo.title,
          artist: artworkInfo.artist,
          image_uri: savedImageUri,
          description: artworkInfo.description,
          session_id: artworkInfo.session_id
        });

        // Navigate to result page after all data is saved
        router.push({
          pathname: '/result',
          params: { 
            collectionId: collection.id,
            sessionId: session.id
          }
        });

      } catch (error) {
        console.error('Error processing artwork:', error);
        setStatus('Error processing artwork. Please try again.');
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    };

    processArtwork();

    // Animate blur and opacity
    Animated.parallel([
      Animated.timing(blurAnim, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1A1A1A']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.imageContainer, {
          opacity: opacityAnim,
        }]}>
          <Animated.Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              {
                transform: [{ scale: 1.1 }],
              },
            ]}
          />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.text}>{status}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '80%',
    height: '50%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LoadingScreen; 