import { saveAudioToFileSystem } from '../utils/fileSystem';
import { addMessage } from '../database/messages';

interface PollAudioOptions {
  sessionId: string;
  description: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  timeoutMs?: number;
}

export const pollAudioUrl = ({
  sessionId,
  description,
  onSuccess,
  onError,
  timeoutMs = 30 * 1000
}: PollAudioOptions) => {
  const startTime = Date.now();
  
  const poll = async () => {
    try {
      const response = await fetch(`http://192.168.1.6:8000/api/audio_url?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.audio_url) {
        const savedAudioUri = await saveAudioToFileSystem(data.audio_url);
        await addMessage({
          session_id: sessionId,
          role: 'assistant',
          text: description,
          audio_path: savedAudioUri
        });
        onSuccess?.();
        return true;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        onError?.(new Error('Audio polling timeout'));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error polling audio URL:', error);
      onError?.(error);
      return false;
    }
  };

  // Start polling
  const pollInterval = setInterval(async () => {
    const isDone = await poll();
    if (isDone) {
      clearInterval(pollInterval);
    }
  }, 5000);

  // Return cleanup function
  return () => clearInterval(pollInterval);
}; 