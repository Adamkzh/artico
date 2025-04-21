import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

// Open database
const db = SQLite.openDatabaseSync('artico.db');

// Initialize database
export const initDatabase = async () => {
  try {
    // Debug: Log database path
    const dbPath = `${FileSystem.documentDirectory}SQLite/artico.db`;
    console.log('Database path:', dbPath);

    // Check if database exists
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    console.log('Database exists:', dbInfo.exists);

    if (dbInfo.exists) {
      // If database exists, try to drop and recreate tables
      console.log('Dropping existing tables...');
      await db.runAsync('DROP TABLE IF EXISTS sessions');
      await db.runAsync('DROP TABLE IF EXISTS messages');
      await db.runAsync('DROP TABLE IF EXISTS collections');
    }

    // Create tables
    console.log('Creating tables...');
    await db.runAsync(
      'CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, type TEXT, museum_name TEXT, museum_location TEXT, title TEXT, artist TEXT, image_uri TEXT, description TEXT, created_at INTEGER, session_id TEXT)'
    );
    await db.runAsync(
      'CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, type TEXT, created_at INTEGER, artwork_id TEXT, artwork_description TEXT, session_id TEXT)'
    );
    await db.runAsync(
      'CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, type TEXT, session_id TEXT, role TEXT, text TEXT, audio_path TEXT, created_at INTEGER)'
    );

    // Verify tables were created
    const tables = await db.getAllAsync<{ name: string }>('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('Existing tables:', tables.map(t => t.name));

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default db; 