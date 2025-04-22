import * as FileSystem from 'expo-file-system';

export const saveImageToFileSystem = async (imageUri: string): Promise<string> => {
  try {
    // Create a unique filename using timestamp
    const filename = `artwork_${Date.now()}.jpg`;
    const fileUri = `${FileSystem.documentDirectory}images/${filename}`;
    
    // Ensure the images directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images`, { intermediates: true });
    
    // Copy the image to the app's document directory
    await FileSystem.copyAsync({
      from: imageUri,
      to: fileUri
    });
    
    return fileUri;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

export const deleteImageFromFileSystem = async (fileUri: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(fileUri);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const saveAudioToFileSystem = async (audioUrl: string): Promise<string> => {
  try {
    // Create a unique filename using timestamp
    const filename = `audio_${Date.now()}.mp3`;
    const fileUri = `${FileSystem.documentDirectory}audio/${filename}`;
    
    // Ensure the audio directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}audio`, { intermediates: true });
    
    // Download the audio file to the app's document directory
    const downloadResult = await FileSystem.downloadAsync(audioUrl, fileUri);
    
    return downloadResult.uri;
  } catch (error) {
    console.error('Error saving audio:', error);
    throw error;
  }
};

export const deleteAudioFromFileSystem = async (fileUri: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(fileUri);
  } catch (error) {
    console.error('Error deleting audio:', error);
    throw error;
  }
}; 