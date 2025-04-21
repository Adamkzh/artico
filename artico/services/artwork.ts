export interface ArtworkInfo {
  title: string;
  artist: string;
  museum_name: string;
  description: string;
  audio_description_url?: string;
  session_id: string;
}

export const identifyArtwork = async (imageUri: string): Promise<ArtworkInfo> => {
  return {
    title: 'Sample Artwork',
    artist: 'Sample Artist',
    museum_name: 'Sample Museum',
    description: 'This is a sample artwork description.',
    session_id: `session_${Date.now()}`
  };
}; 