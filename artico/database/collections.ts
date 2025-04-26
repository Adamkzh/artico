import db from './database';
import { deleteImageFromFileSystem } from '../utils/fileSystem';

export interface Collection {
  id: string;
  type: 'collection';
  museum_name: string;
  title: string;
  artist: string;
  image_uri?: string;
  description?: string;
  created_at: number;
  session_id: string;
}

export const addCollection = async (collection: Omit<Collection, 'id' | 'type' | 'created_at'>): Promise<Collection> => {
  const id = `collection_${Date.now()}`;
  const created_at = Date.now();
  
  await db.runAsync(
    'INSERT INTO collections (id, type, museum_name, title, artist, image_uri, description, created_at, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      'collection',
      collection.museum_name,
      collection.title,
      collection.artist,
      collection.image_uri || null,
      collection.description || null,
      created_at,
      collection.session_id
    ]
  );

  return {
    id,
    type: 'collection',
    ...collection,
    created_at
  };
};

export const getCollection = async (collectionId: string): Promise<Collection | null> => {
  const result = await db.getFirstAsync<Collection>(
    'SELECT * FROM collections WHERE id = ?',
    [collectionId]
  );
  return result || null;
};

export const getCollectionsByMuseum = async (museumName: string): Promise<Collection[]> => {
  return await db.getAllAsync<Collection>(
    'SELECT * FROM collections WHERE museum_name = ? ORDER BY created_at DESC',
    [museumName]
  );
};

export const updateCollection = async (collection: Collection): Promise<Collection> => {
  await db.runAsync(
    'UPDATE collections SET museum_name = ?, title = ?, artist = ?, image_uri = ?, description = ? WHERE id = ?',
    [
      collection.museum_name,
      collection.title,
      collection.artist,
      collection.image_uri || null,
      collection.description || null,
      collection.id
    ]
  );
  return collection;
};

export const deleteCollection = async (collectionId: string): Promise<void> => {
  try {
    // Get the collection first to get the image URI and session_id
    const collection = await getCollection(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Delete associated messages
    await db.runAsync(
      'DELETE FROM messages WHERE session_id = ?',
      [collection.session_id]
    );

    // Delete associated session
    await db.runAsync(
      'DELETE FROM sessions WHERE id = ?',
      [collection.session_id]
    );

    // Delete the image file if it exists
    if (collection.image_uri) {
      await deleteImageFromFileSystem(collection.image_uri);
    }
    
    // Delete the collection from the database
    await db.runAsync(
      'DELETE FROM collections WHERE id = ?',
      [collectionId]
    );
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

export const getAllCollections = async (): Promise<Collection[]> => {
  return await db.getAllAsync<Collection>(
    'SELECT * FROM collections ORDER BY created_at DESC'
  );
}; 