import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
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
    <View style={styles.container}>
      {/* 顶部日期和提示 */}
      <View style={styles.topBar}>
        <Text style={styles.dateText}>{dateStr}</Text>
        <Text style={styles.tipText}>{t('cameraTip')}</Text>
      </View>

      {/* 相机和取景框 */}
      <CameraView style={styles.camera} facing={type} ref={cameraRef}>
        <View style={styles.frameContainer}>
          <View style={styles.frame} />
        </View>
      </CameraView>

      {/* 底部半圆白色区域，含回退、快门、图库按钮 */}
      <View style={styles.bottomPanel}>
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#888" />
        </TouchableOpacity>
        {/* 快门按钮 */}
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        {/* 图库按钮 */}
        <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
          <Ionicons name="images" size={28} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'flex-start', zIndex: 10, paddingLeft: 24 },
  dateText: { color: '#fff', fontSize: 32, fontWeight: '600', marginBottom: 2 },
  tipText: { color: '#fff', fontSize: 16, marginBottom: 8 },
  camera: { flex: 1 },
  frameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE, borderWidth: 3, borderColor: '#fff', borderRadius: 16, backgroundColor: 'transparent' },
  bottomPanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 160,
    backgroundColor: '#fafafa', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { height: -2, width: 0 },
    flexDirection: 'row', paddingHorizontal: 40,
  },
  backButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, zIndex: 2,
  },
  captureButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', borderWidth: 4, borderColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
  },
  captureButtonInner: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff', borderWidth: 4, borderColor: '#e0e0e0', borderStyle: 'dashed',
  },
  galleryButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
  },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20 },
  permissionButton: { backgroundColor: '#fff', padding: 15, borderRadius: 8 },
  permissionButtonText: { color: '#000', fontWeight: 'bold' },
});

export default CameraScreen; 