import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

// Open database
const db = SQLite.openDatabaseSync('artico.db');

// Initialize database
export const initDatabase = async () => {
  try {
    // Debug: Log database path
    const dbPath = `${FileSystem.documentDirectory}SQLite/artico.db`;

    // Check if database exists
    const dbInfo = await FileSystem.getInfoAsync(dbPath);

    // Create tables if they don't exist
    await db.runAsync(
      'CREATE TABLE IF NOT EXISTS artworks (id TEXT PRIMARY KEY, type TEXT, museum_name TEXT, museum_location TEXT, title TEXT, artist TEXT, image_uri TEXT, description TEXT, created_at INTEGER, session_id TEXT, audio_url TEXT, liked INTEGER DEFAULT 0)'
    );
    await db.runAsync(
      'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, type TEXT, artwork_id TEXT, role TEXT, text TEXT, audio_path TEXT, created_at INTEGER)'
    );

    // Verify tables were created
    const tables = await db.getAllAsync<{ name: string }>('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default db; 