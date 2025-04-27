import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Collection, getAllCollections } from '../database/collections';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - 40 - COLUMN_GAP) / NUM_COLUMNS; // 40 for padding

const HomeScreen = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [date, setDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Update date and greeting
    const updateDateTime = () => {
      const now = new Date();
      setDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }));

      const hour = now.getHours();
      if (hour < 12) {
        setGreeting(t('goodMorning'));
      } else if (hour < 18) {
        setGreeting(t('goodAfternoon'));
      } else {
        setGreeting(t('goodEvening'));
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);

    // Load collections
    const loadCollections = async () => {
      const collectionsData = await getAllCollections();
      setCollections(collectionsData);
    };

    loadCollections();

    return () => clearInterval(interval);
  }, [t]);

  // Auto-refresh collections when focused
  useFocusEffect(
    React.useCallback(() => {
      const loadCollections = async () => {
        const collectionsData = await getAllCollections();
        setCollections(collectionsData);
      };
      loadCollections();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    const collectionsData = await getAllCollections();
    setCollections(collectionsData);
    setRefreshing(false);
  }, []);

  const renderCollectionGrid = () => {
    const rows = [];
    for (let i = 0; i < collections.length; i += NUM_COLUMNS) {
      const row = collections.slice(i, i + NUM_COLUMNS);
      rows.push(
        <View key={i} style={styles.row}>
          {row.map((collection, index) => (
            <TouchableOpacity
              key={collection.id}
              style={styles.collectionItem}
              onPress={() => router.push(`/collection/${collection.id}`)}
            >
              {collection.image_uri && (
                <Image
                  source={{ uri: collection.image_uri }}
                  style={styles.collectionImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionTitle} numberOfLines={1}>
                  {collection.title}
                </Text>
                <Text style={styles.collectionMuseum} numberOfLines={1}>
                  {collection.museum_name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {/* Add empty items to complete the row */}
          {row.length < NUM_COLUMNS &&
            Array(NUM_COLUMNS - row.length)
              .fill(null)
              .map((_, index) => (
                <View key={`empty-${index}`} style={[styles.collectionItem, styles.emptyItem]} />
              ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={{ flex: 1 }}>
      {isFocused && (
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View>
              <Text style={styles.date}>{date}</Text>
              <Text style={styles.greeting}>{greeting}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Camera Button */}
          <View style={styles.cameraSection}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => router.push('/camera')}
            >
              <Ionicons name="camera" size={40} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Collections Grid */}
          <View style={styles.collectionsSection}>
            <Text style={styles.sectionTitle}>{t('collections')}</Text>
            {renderCollectionGrid()}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  date: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.7,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: COLUMN_GAP,
  },
  collectionItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyItem: {
    backgroundColor: 'transparent',
  },
  collectionImage: {
    width: '100%',
    height: ITEM_WIDTH * 1.2,
  },
  collectionInfo: {
    padding: 12,
  },
  collectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  collectionMuseum: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
  },
});

export default HomeScreen; 