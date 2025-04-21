import db from './database';

export interface Message {
  id: string;
  type: 'message';
  session_id: string;
  role: string;
  text: string;
  audio_path?: string;
  created_at: number;
}

export const addMessage = async (message: Omit<Message, 'id' | 'type' | 'created_at'>): Promise<Message> => {
  const id = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const created_at = Date.now();
  
  await db.runAsync(
    'INSERT INTO messages (id, type, session_id, role, text, audio_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      id,
      'message',
      message.session_id,
      message.role,
      message.text,
      message.audio_path || null,
      created_at
    ]
  );

  return {
    id,
    type: 'message',
    ...message,
    created_at
  };
};

export const getMessagesBySession = async (sessionId: string): Promise<Message[]> => {
  const results = await db.getAllAsync<Message>(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId]
  );
  return results;
};

export const getLastMessage = async (sessionId: string): Promise<Message | null> => {
  const result = await db.getFirstAsync<Message>(
    'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
    [sessionId]
  );
  return result || null;
}; 