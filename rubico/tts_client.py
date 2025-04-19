import os
import uuid
from openai import OpenAI
from gtts import gTTS

# def synthesize_speech(text, session_id):
#     filename = f"{uuid.uuid4()}.mp3"
#     path = os.path.join("uploads", filename)
#     tts = gTTS(text, lang='zh')
#     tts.save(path)
#     return f"/uploads/{filename}"


client = OpenAI()

def synthesize_speech(text, session_id):
    filename = f"{uuid.uuid4()}.mp3"
    speech_file_path = os.path.join("uploads", filename)

    response = client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",  # 其他可选：,alloy, shimmer, echo, fable, nova
        input=text
    )
    
    response.stream_to_file(speech_file_path)

    return speech_file_path