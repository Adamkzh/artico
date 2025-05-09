from google import genai
from google.genai import types
from model.ArtworkMetadata import ArtworkMetadata
from .client import AIClient
from .tts_client import synthesize_speech
from utils.s3Server import upload_file_and_get_presigned_url

class GeminiClient(AIClient):
    def __init__(self, api_key, language="en", role="adult"):
        """
        Initialize the Gemini client.
        
        :param api_key: Gemini API key
        :param language: Target language for responses
        :param role: User type (child, adult, senior, expert)
        """
        super().__init__(language, role)
        genai.configure(api_key=api_key)
        self.model_name = 'gemini-1.5-flash' 
 
    def generate_initial_description(self, image_bytes, language="en", role="adult"):
        """
        Generate the initial spoken description for an artwork using Gemini Flash model.
        """
        pass

    def continue_conversation(self, user_input: str, history: list = None):
        """
        Continue the conversation with Gemini.
        
        :param user_input: The user's input message
        :param history: List of previous messages in the conversation
        :return: The AI's response
        """
        if history is None:
            history = []
            
        # Create chat session
        chat = self.chat_model.start_chat(history=history)
        
        # Get response
        response = chat.send_message(user_input)
        
        return response.text

    def generate_and_store_audio(self, description: str, session_id: str):
        """
        Generate audio from description and store it.
        
        :param description: The text to convert to audio
        :param session_id: Unique session identifier
        """
        try:
            audio_bytes = synthesize_speech(description)
            upload_file_and_get_presigned_url(audio_bytes, session_id)
        except Exception as e:
            print(f"Error generating audio for session {session_id}: {e}")
