export interface ArtworkInfo {
  title: string;
  artist: string;
  museum_name: string;
  description: string;
  audio_description_url?: string;
  session_id: string;
}

export const identifyArtwork = async (imageUri: string): Promise<ArtworkInfo> => {
  try {
    // Create FormData to send the image
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'artwork.jpg'
    } as any);

    // Call the backend API
    const response = await fetch('YOUR_BACKEND_URL/api/recognize', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });


    // {
    //   title: string;
    //   artist: string;
    //   museum_name: string;
    //   description: string;
    //   audio_description_url?: string;
    //   session_id?: string;
    // }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      title: data.title,
      artist: data.artist,
      museum_name: data.museum_name,
      description: data.description,
      audio_description_url: data.audio_description_url,
      session_id: data.session_id || `session_${Date.now()}`
    };
  } catch (error) {
    console.error('Error identifying artwork:', error);
    throw error;
  }
}; 