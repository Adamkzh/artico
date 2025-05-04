import { saveAudioToFileSystem } from '../utils/fileSystem';

interface PollAudioOptions {
  sessionId: string;
  onAudioReady: (localAudioUri: string) => void;
  onError?: (error: any) => void;
  timeoutMs?: number;
}

export const pollAudioUrl = ({
  sessionId,
  onAudioReady,
  onError,
  timeoutMs = 30 * 1000
}: PollAudioOptions) => {
  const startTime = Date.now();

  const poll = async () => {
    try {
      const ip = "192.168.1.21";
      const response = await fetch(`http://${ip}:8000/api/audio_url?session_id=${sessionId}`);
      const data = await response.json();

      if (data.audio_url) {
        const savedAudioUri = await saveAudioToFileSystem(data.audio_url);
        console.log(`Audio saved to ${savedAudioUri}`);
        onAudioReady(savedAudioUri);
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

  const pollInterval = setInterval(async () => {
    const isDone = await poll();
    if (isDone) {
      clearInterval(pollInterval);
    }
  }, 5000);

  return () => clearInterval(pollInterval);
}; 