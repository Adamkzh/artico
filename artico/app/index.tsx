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
const ITEM_WIDTH = (SCREEN_WIDTH - 40 - COLUMN_GAP) / NUM_COLUMNS;
const MAX_ITEM_HEIGHT = 160; // Maximum height for artwork images

type TabType = 'collections' | 'liked';

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
  const [activeTab, setActiveTab] = useState<TabType>('collections');

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
    const filteredArtworks = activeTab === 'liked' 
      ? artworksData.filter(artwork => artwork.liked)
      : artworksData;
    
    setArtworks(filteredArtworks);

    filteredArtworks.forEach((artwork) => {
      if (artwork.image_uri && !imageSizes[artwork.id]) {
        Image.getSize(
          artwork.image_uri,
          (width, height) => {
            const aspectRatio = height / width;
            const calculatedHeight = Math.min(ITEM_WIDTH * aspectRatio, MAX_ITEM_HEIGHT);
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
    }, [activeTab])
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

  function groupArtworksByDay(artworks: any[]) {
    const groups: { [date: string]: any[] } = {};
    artworks.forEach((artwork) => {
      const dateObj = new Date(artwork.created_at);
      const dateStr = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(artwork);
    });
    return groups;
  }

  const renderArtworkGrid = () => {
    if (activeTab === 'collections') {
      const grouped = groupArtworksByDay(artworks);
      return (
        <View>
          {Object.entries(grouped).map(([dateStr, groupArtworks]) => {
            const columns: any[][] = Array.from({ length: NUM_COLUMNS }, () => []);
            const columnHeights: number[] = Array(NUM_COLUMNS).fill(0);

            groupArtworks.forEach((artwork: any) => {
              const height = Math.min(imageSizes[artwork.id] || ITEM_WIDTH * (4 / 3), MAX_ITEM_HEIGHT);
              const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
              columns[shortestColumnIndex].push({ ...artwork, height });
              columnHeights[shortestColumnIndex] += height + COLUMN_GAP;
            });

            return (
              <View key={dateStr}>
                <Text style={styles.daySectionTitle}>{dateStr}</Text>
                <View style={styles.masonryContainer}>
                  {columns.map((column, colIndex) => (
                    <View key={colIndex} style={styles.masonryColumn}>
                      {column.map((artwork) => (
                        <Pressable
                          key={artwork.id}
                          style={[styles.cardContainer, { height: artwork.height + 56 }]}
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
                              style={[styles.artworkImage, { height: artwork.height }]}
                              resizeMode="cover"
                            />
                          )}
                          <View style={styles.artworkTextWrapper}>
                            <Text style={styles.artworkTitle} numberOfLines={1}>
                              {artwork.title}
                            </Text>
                            <Text style={styles.artworkArtist} numberOfLines={1}>
                              {artwork.artist}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      );
    } else {
      // Liked tab: just show the grid as before
      const columns: any[][] = Array.from({ length: NUM_COLUMNS }, () => []);
      const columnHeights: number[] = Array(NUM_COLUMNS).fill(0);

      artworks.forEach((artwork) => {
        const height = Math.min(imageSizes[artwork.id] || ITEM_WIDTH * (4 / 3), MAX_ITEM_HEIGHT);
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
        columns[shortestColumnIndex].push({ ...artwork, height });
        columnHeights[shortestColumnIndex] += height + COLUMN_GAP;
      });

      return (
        <View style={styles.masonryContainer}>
          {columns.map((column, colIndex) => (
            <View key={colIndex} style={styles.masonryColumn}>
              {column.map((artwork) => (
                <Pressable
                  key={artwork.id}
                  style={[styles.cardContainer, { height: artwork.height + 56 }]}
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
                      style={[styles.artworkImage, { height: artwork.height }]}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.artworkTextWrapper}>
                    <Text style={styles.artworkTitle} numberOfLines={1}>
                      {artwork.title}
                    </Text>
                    <Text style={styles.artworkArtist} numberOfLines={1}>
                      {artwork.artist}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      );
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'collections' && styles.activeTab]}
        onPress={() => setActiveTab('collections')}
      >
        <Text style={[styles.tabText, activeTab === 'collections' && styles.activeTabText]}>
          Artico History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
        onPress={() => setActiveTab('liked')}
      >
        <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
          Liked Artworks
        </Text>
      </TouchableOpacity>
    </View>
  );

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
                <Ionicons name="scan-outline" size={60} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {renderTabs()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  date: { color: '#FFFFFF', fontSize: 16, opacity: 0.7 },
  greeting: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraSection: { alignItems: 'center', paddingVertical: 30 },
  cameraButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  countText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.5,
    marginBottom: 8,
  },
  artworksSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: COLUMN_GAP,
  },
  masonryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  masonryColumn: {
    width: ITEM_WIDTH,
  },
  cardContainer: {
    width: ITEM_WIDTH,
    marginBottom: COLUMN_GAP,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  artworkImage: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  artworkTextWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  artworkTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  artworkArtist: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'rgba(255, 255, 255, 0.72)',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  daySectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
});

export default HomeScreen;
