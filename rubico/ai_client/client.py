from abc import ABC, abstractmethod
from utils.s3Server import upload_file_and_get_presigned_url



class AIClient(ABC):
    def __init__(self, language="en", role="adult"):
        """
        Initialize the AI client with language and role settings.
        
        :param language: Target language for responses
        :param role: User type (child, adult, senior, expert)
        """
        self.language = language
        self.role = role

    @abstractmethod
    def generate_initial_description(self, image_bytes):
        """
        Generate the initial spoken description for an artwork.
        
        :param image_bytes: The image content in bytes
        :param language: Target language for explanation
        :param role: User type (child, adult, senior, expert)
        :return: ArtworkMetadata object
        """
        pass

    @abstractmethod
    def continue_conversation(self, user_input: str, history: list = None):
        """
        Continue the conversation with the AI model.
        
        :param user_input: The user's input message
        :param history: List of previous messages in the conversation
        :return: The AI's response
        """
        pass

    @abstractmethod
    def generate_and_store_audio(self, description: str, session_id: str):
        """
        Generate audio from description and store it.
        
        :param description: The text to convert to audio
        :param session_id: Unique session identifier
        """
        pass
