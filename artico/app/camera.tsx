import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, PanResponder } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '../utils/i18n/LanguageContext';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.5;

const CameraScreen = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const { t } = useLanguage();

  // 日期
  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  }, []);

  const pan = useRef(new Animated.ValueXY()).current;
  const isNavigating = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup animation on unmount
      if (animationRef.current) {
        animationRef.current.stop();
      }
      pan.setValue({ x: 0, y: 0 });
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx > 0 && !isNavigating.current) { // Only allow right swipe
          pan.x.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 100 && !isNavigating.current) { // If swiped right more than 100 units
          handleBack();
        } else {
          // Stop any existing animation
          if (animationRef.current) {
            animationRef.current.stop();
          }

          animationRef.current = Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          });

          animationRef.current.start(() => {
            animationRef.current = null;
          });
        }
      },
    })
  ).current;

  const handleBack = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    router.back();
    animationRef.current = Animated.timing(pan, {
      toValue: { x: width, y: 0 },
      duration: 300,
      useNativeDriver: true,
    });

    animationRef.current.start(() => {
      pan.setValue({ x: 0, y: 0 });
      isNavigating.current = false;
      animationRef.current = null;
    });
  };

  // 拍照
  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          router.push({ pathname: '/loading', params: { imageUri: photo.uri } });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  // 选图库
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      router.push({ pathname: '/loading', params: { imageUri: result.assets[0].uri } });
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('cameraPermission') || 'We need your permission to show the camera'}</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>{t('grantPermission') || 'Grant Permission'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Camera Preview */}
        <CameraView style={StyleSheet.absoluteFill} facing={type} ref={cameraRef} />
        
        {/* Overlay: Top Section */}
        <View style={styles.topBar} pointerEvents="box-none">
          <View style={styles.topContent}>
            <Text style={styles.tipText}>{t('cameraTitle')}</Text>
            <Text style={styles.subTipText}>{t('cameraSubtitle')}</Text>
          </View>
        </View>

        {/* Overlay: Frame */}
        <View style={styles.frameContainer} pointerEvents="box-none">
          <View style={styles.frame}>
            <View style={styles.frameCorner} />
            <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
          </View>
        </View>

        {/* Overlay: Bottom Panel */}
        <View style={styles.bottomPanel} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={28} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={handleCapture}
            hitSlop={10}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.galleryButton} 
            onPress={pickImage}
            hitSlop={10}
          >
            <Ionicons name="images" size={28} color="#888" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  topBar: { 
    position: 'absolute', 
    top: 60, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    paddingHorizontal: 24 
  },
  topContent: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 18,
    padding: 18,
    maxWidth: '85%',
  },
  tipText: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: '700',
    marginBottom: 8,
  },
  subTipText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 22,
  },
  frameContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  frame: { 
    width: FRAME_SIZE, 
    height: FRAME_SIZE, 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.3)', 
    borderRadius: 16,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: -2,
    left: -2,
  },
  frameCornerTopRight: {
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    left: 'auto',
    right: -2,
  },
  frameCornerBottomLeft: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
    top: 'auto',
    bottom: -2,
  },
  frameCornerBottomRight: {
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    top: 'auto',
    left: 'auto',
    right: -2,
    bottom: -2,
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    backgroundColor: 'rgba(250,250,250,0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { height: -2, width: 0 },
    flexDirection: 'row',
    paddingHorizontal: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  message: { 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  permissionButton: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8 
  },
  permissionButtonText: { 
    color: '#000', 
    fontWeight: 'bold' 
  },
});

export default CameraScreen; 