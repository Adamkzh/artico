interface ChatResponse {
  text: string;
  audio_url?: string;
}

export const generateResponse = async (sessionId: string, message: string): Promise<ChatResponse> => {
  try {
    // TODO: Implement actual chat API call
    // For now, return a mock response
    return {
      text: `I understand you're asking about "${message}". This is a placeholder response.`,
      audio_url: undefined
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}; 