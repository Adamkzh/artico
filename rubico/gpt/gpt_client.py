from openai import OpenAI
import base64
from session_store import init_session
from gpt.promptGenerator import PromptGenerator
from model.ArtworkMetadata import ArtworkMetadata

client = OpenAI()

 
def generate_initial_description(image_bytes, language_description="English", role="adult"):
    """
    Generate the initial spoken description for an artwork based on the uploaded image.
    
    :param image_bytes: The image content in bytes.
    :param language_description: Target language for explanation (default: English).
    :param role: User type (child, adult, senior, expert).
    :return: (session_id, messages, reply_text)
    """

    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    prompt_generator = PromptGenerator(language_description=language_description, role=role)
    
    messages = [
        {"role": "system", "content": prompt_generator.generate_role()},
        {"role": "user", "content": [
            {"type": "text", "text": prompt_generator.generate_structure_prompt()},
            {"type": "image_url", "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}"
            }}
        ]}
    ]

    completion = client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=messages,
        max_tokens=600,
        response_format=ArtworkMetadata,
    )
    
    reply_json = completion.choices[0].message.parsed
    return reply_json



def continue_conversation(history, user_input):
    history.append({"role": "user", "content": user_input})
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=history,
        max_tokens=600
    )
    reply = completion.choices[0].message.content
    history.append({"role": "assistant", "content": reply})
    return reply, history