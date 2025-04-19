import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const LoadingScreen = () => {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [blurAnim] = useState(new Animated.Value(10));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Simulate artwork recognition process
    const timer = setTimeout(() => {
      router.push({
        pathname: '/result',
        params: { imageUri }
      });
    }, 3000);

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

    return () => clearTimeout(timer);
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
          <Text style={styles.text}>Identifying artwork...</Text>
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
    resizeMode: 'cover',
  },
  textContainer: {
    position: 'absolute',
    bottom: 100,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default LoadingScreen; 