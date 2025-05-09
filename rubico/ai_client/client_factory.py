import os
from .client import AIClient
from .gemini_client import GeminiClient
from .gpt_client import GPTClient

class AIClientFactory:
    @staticmethod
    def create_client(model_type: str = None, language: str = "en", role: str = "adult") -> AIClient:
        """
        Create an AI client instance based on the specified model type.
        
        :param model_type: The type of AI model to use ("gpt" or "gemini")
        :param language: Target language for responses
        :param role: User type (child, adult, senior, expert)
        :return: An instance of AIClient
        """
        if model_type is None:
            model_type = os.getenv("AI_MODEL_TYPE", "gpt")
            
        if model_type.lower() == "gpt":
            return GPTClient(language=language, role=role)
        elif model_type.lower() == "gemini":
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is not set")
            return GeminiClient(api_key=api_key, language=language, role=role)
        else:
            raise ValueError("Unsupported model type. Use 'gpt' or 'gemini'") 