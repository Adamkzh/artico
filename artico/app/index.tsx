import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [greeting, setGreeting] = useState('');
  const [scannedArtworks, setScannedArtworks] = useState([]);

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
        setGreeting('Good Morning');
      } else if (hour < 18) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.topBar}>
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
      </View>

      {/* Center Section */}
      <View style={styles.centerSection}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => router.push('/camera')}
        >
          <Ionicons name="camera" size={40} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Section */}
      <ScrollView style={styles.bottomSection}>
        {scannedArtworks.length === 0 ? (
          <Text style={styles.emptyText}>No artworks scanned yet</Text>
        ) : (
          scannedArtworks.map((artwork, index) => (
            <View key={index} style={styles.artworkItem}>
              {/* Artwork item content will be added later */}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topSection: {
    padding: 20,
    paddingTop: 60,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 20,
  },
  artworkItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
});

export default HomeScreen; 