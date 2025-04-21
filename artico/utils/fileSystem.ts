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