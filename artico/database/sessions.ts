import db from './database';
import { Message } from './messages';

export interface Session {
  id: string;
  type: 'session';
  created_at: number;
  artwork_id: string;
  messages?: Message[];
  session_id?: string;
}

export const addSession = async (session: Omit<Session, 'id' | 'type' | 'created_at'> & { session_id: string }): Promise<Session> => {
  const created_at = Date.now();
  
  await db.runAsync(
    'INSERT INTO sessions (id, type, created_at, artwork_id, session_id) VALUES (?, ?, ?, ?, ?)',
    [
      session.session_id,
      'session',
      created_at,
      session.artwork_id,
      session.session_id
    ]
  );

  return {
    id: session.session_id,
    type: 'session',
    ...session,
    created_at
  };
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
  const result = await db.getFirstAsync<Session>(
    'SELECT * FROM sessions WHERE id = ?',
    [sessionId]
  );
  return result || null;
};

export const getSessionsByArtwork = async (artworkId: string): Promise<Session[]> => {
  const results = await db.getAllAsync<Session>(
    'SELECT * FROM sessions WHERE artwork_id = ? ORDER BY created_at DESC',
    [artworkId]
  );
  return results;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await db.runAsync(
    'DELETE FROM sessions WHERE id = ?',
    [sessionId]
  );
};

export const getSessionsByCollection = async (collectionId: string): Promise<Session[]> => {
  const results = await db.getAllAsync<Session>(
    'SELECT * FROM sessions WHERE artwork_id = ? ORDER BY created_at DESC',
    [collectionId]
  );
  return results;
};

export const getSessionWithMessages = async (sessionId: string): Promise<Session | null> => {
  const session = await getSession(sessionId);
  if (!session) return null;

  const messages = await db.getAllAsync<Message>(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );

  return {
    ...session,
    messages
  };
};

export const addMessagesToSession = async (sessionId: string, messages: Omit<Message, 'id' | 'type' | 'created_at'>[]): Promise<void> => {
  for (const message of messages) {
    const id = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const created_at = Date.now();
    
    await db.runAsync(
      'INSERT INTO messages (id, type, session_id, role, text, audio_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        'message',
        sessionId,
        message.role,
        message.text,
        message.audio_path || null,
        created_at
      ]
    );
  }
};

export const updateSessionMessages = async (sessionId: string, messages: Message[]): Promise<void> => {
  // First, delete all existing messages for this session
  await db.runAsync(
    'DELETE FROM messages WHERE session_id = ?',
    [sessionId]
  );

  // Then add all new messages
  for (const message of messages) {
    await db.runAsync(
      'INSERT INTO messages (id, type, session_id, role, text, audio_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        message.id,
        'message',
        sessionId,
        message.role,
        message.text,
        message.audio_path || null,
        message.created_at
      ]
    );
  }
}; 