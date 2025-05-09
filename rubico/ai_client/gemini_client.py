from google import genai
from google.genai import types
from model.ArtworkMetadata import ArtworkMetadata
from .client import AIClient
from .promptGenerator import PromptGenerator
from .tts_client import synthesize_speech
from utils.s3Server import upload_file_and_get_presigned_url
import json
from typing import Dict


class GeminiClient(AIClient):
    def __init__(self, api_key, language="en", role="adult"):
        """
        Initialize the Gemini client.
        
        :param api_key: Gemini API key
        :param language: Target language for responses
        :param role: User type (child, adult, senior, expert)
        """
        super().__init__(language, role)
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash-exp'
        self.prompt_generator = PromptGenerator(language=language, role=role) 
 
    def generate_initial_description(self, image_bytes):
        """
        Generate the initial spoken description for an artwork using Gemini Flash model.
        """
        prompt = self.prompt_generator.generate_structure_prompt()

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
                prompt,
                self.prompt_generator.language,
            ],
            config={
                "response_mime_type": "application/json",
                "response_schema": ArtworkMetadata,
            },
        )
        print(response)
        artwork_data: ArtworkMetadata = response.parsed
        return artwork_data


    def continue_conversation(self, user_input: str, history = []):
        """
        Continue the conversation with Gemini.
        
        :param user_input: The user's input message
        :param history: List of previous messages in the conversation
        :return: The AI's response
        """
            
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
            # audio_bytes = synthesize_speech(description)
            # upload_file_and_get_presigned_url(audio_bytes, session_id)
            pass
        except Exception as e:
            print(f"Error generating audio for session {session_id}: {e}")
