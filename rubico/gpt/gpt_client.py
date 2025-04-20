from openai import OpenAI
import base64
from session_store import init_session
from gpt.promptGenerator import PromptGenerator

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
            {"type": "text", "text": prompt_generator.generate_context()},
            {"type": "image_url", "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}"
            }}
        ]}
    ]
    
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=600
    )
    
    reply_text = completion.choices[0].message.content
    return reply_text



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