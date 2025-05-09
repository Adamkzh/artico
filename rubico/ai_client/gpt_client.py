from openai import OpenAI
import base64
from .promptGenerator import PromptGenerator
from model.ArtworkMetadata import ArtworkMetadata
from .client import AIClient
from .tts_client import synthesize_speech
from utils.s3Server import upload_file_and_get_presigned_url

class GPTClient(AIClient):
    def __init__(self, language="en", role="adult"):
        """
        Initialize the GPT client.
        
        :param language: Target language for responses
        :param role: User type (child, adult, senior, expert)
        """
        super().__init__(language, role)
        self.client = OpenAI()
        self.model_name = "gpt-4-vision-preview"
        self.prompt_generator = PromptGenerator(language=language, role=role)

    def generate_initial_description(self, image_bytes, language="en", role="adult"):
        """
        Generate the initial spoken description for an artwork using GPT-4 Vision.
        """
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        print("Generating initial description...")
        messages = [
            {"role": "system", "content": self.prompt_generator.generate_role()},
            {"role": "user", "content": [
                {"type": "text", "text": self.prompt_generator.generate_structure_prompt()},
                {"type": "image_url", "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}"
                }}
            ]}
        ]

        completion = self.client.beta.chat.completions.parse(
            model="gpt-4.1-mini",
            messages=messages,
            max_tokens=800,
            response_format=ArtworkMetadata,
        )
        reply_json = completion.choices[0].message.parsed
        return reply_json

    def continue_conversation(self, user_input: str, history = []):
        """
        Continue the conversation with GPT.
        
        :param user_input: The user's input message
        :param history: List of previous messages in the conversation
        :return: The AI's response
        """
        history.append({"role": "user", "content": user_input})
        
        completion = self.client.chat.completions.create(
            model="gpt-4.1-nano",
            messages=history,
            max_tokens=600
        )
        
        reply = completion.choices[0].message.content
        history.append({"role": "assistant", "content": reply})
        
        return reply

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
