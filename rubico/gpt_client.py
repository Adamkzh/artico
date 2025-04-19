from openai import OpenAI
import os
from session_store import init_session


client = OpenAI()

def generate_initial_description(image_bytes):
    import base64

    session_id = init_session()
    
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    messages = [
        {"role": "system", "content": "你是一名博物馆讲解员"},
        {"role": "user", "content": [
            {"type": "text", "text": "请为这幅展品做一个语音讲解"},
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
    reply = completion.choices[0].message.content
    messages = [{"role": "assistant", "content": reply}]
    return session_id, messages, reply


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