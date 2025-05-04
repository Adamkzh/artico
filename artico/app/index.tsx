import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllArtworks, deleteArtwork } from '../database/artworks';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 20;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - 40 - COLUMN_GAP) / NUM_COLUMNS; // 40 for padding

const HomeScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [date, setDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [artworks, setArtworks] = useState<any[]>([]);
  const [imageSizes, setImageSizes] = useState<Record<string, number>>({});
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );

      const hour = now.getHours();
      if (hour < 12) setGreeting(t('goodMorning'));
      else if (hour < 18) setGreeting(t('goodAfternoon'));
      else setGreeting(t('goodEvening'));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    return () => clearInterval(interval);
  }, [t]);

  const loadArtworks = async () => {
    const artworksData = await getAllArtworks();
    setArtworks(artworksData);

    artworksData.forEach((artwork) => {
      if (artwork.image_uri && !imageSizes[artwork.id]) {
        Image.getSize(
          artwork.image_uri,
          (width, height) => {
            const aspectRatio = height / width;
            const calculatedHeight = ITEM_WIDTH * aspectRatio;
            setImageSizes((prev) => ({
              ...prev,
              [artwork.id]: calculatedHeight,
            }));
          },
          (error) => {
            console.warn(`Failed to get size for ${artwork.image_uri}`, error);
          }
        );
      }
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadArtworks();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadArtworks();
    setRefreshing(false);
  }, []);

  const handleDelete = async (artworkId: string) => {
    await deleteArtwork(artworkId);
    await loadArtworks();
  };

  const handleLongPress = () => {
    setEditMode(true);
  };

  const handleExitEditMode = () => {
    setEditMode(false);
  };

  const renderArtworkGrid = () => {
    const rows = [];
    for (let i = 0; i < artworks.length; i += NUM_COLUMNS) {
      const row = artworks.slice(i, i + NUM_COLUMNS);
      rows.push(
        <View key={i} style={styles.row}>
          {row.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={styles.artworkItem}
              onPress={() => !editMode && router.push(`/artwork/${artwork.id}`)}
              onLongPress={handleLongPress}
              delayLongPress={300}
            >
              {editMode && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(artwork.id)}
                  hitSlop={10}
                >
                  <Ionicons name="close-circle" size={28} color="#FF5555" />
                </TouchableOpacity>
              )}
              {artwork.image_uri && (
                <Image
                  source={{ uri: artwork.image_uri }}
                  style={[
                    styles.artworkImage,
                    { height: imageSizes[artwork.id] || ITEM_WIDTH * (4 / 3) },
                  ]}
                  resizeMode="cover"
                />
              )}
              <View style={styles.artworkInfo}>
                <Text style={styles.artworkTitle} numberOfLines={1}>
                  {artwork.title}
                </Text>
                <Text style={styles.artworkArtist} numberOfLines={1}>
                  {artwork.artist}
                </Text>
              </View>
            </Pressable>
          ))}
          {row.length < NUM_COLUMNS &&
            Array(NUM_COLUMNS - row.length)
              .fill(null)
              .map((_, index) => (
                <View key={`empty-${index}`} style={[styles.artworkItem, styles.emptyItem]} />
              ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {isFocused && (
        <Pressable style={{ flex: 1 }} onPress={editMode ? handleExitEditMode : undefined}>
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.date}>{date}</Text>
                <Text style={styles.greeting}>{greeting}</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.cameraSection}>
              <TouchableOpacity style={styles.cameraButton} onPress={() => router.push('/camera')}>
                <Ionicons name="camera" size={40} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.countSection}>
              <Text style={styles.countText}>{artworks.length} Items</Text>
            </View>
            <View style={styles.artworksSection}>{renderArtworkGrid()}</View>
          </ScrollView>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  date: { color: '#FFFFFF', fontSize: 16, opacity: 0.7 },
  greeting: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  profileButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center' },
  cameraSection: { alignItems: 'center', paddingVertical: 30 },
  cameraButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333333', justifyContent: 'center', alignItems: 'center' },
  countSection: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 8, opacity: 0.7 },
  countText: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 8 },
  artworksSection: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: COLUMN_GAP },
  artworkItem: { width: ITEM_WIDTH, backgroundColor: '#181818', borderRadius: 20, overflow: 'hidden', marginBottom: 0 },
  emptyItem: { backgroundColor: 'transparent' },
  artworkImage: { width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  artworkInfo: { padding: 14, paddingBottom: 16 },
  artworkTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  artworkArtist: { color: '#fff', fontSize: 12, opacity: 0.7, fontWeight: '400' },
  deleteButton: { position: 'absolute', top: 8, left: 8, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14 },
});

export default HomeScreen;
