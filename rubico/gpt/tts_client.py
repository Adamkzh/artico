import os
from datetime import datetime
from openai import OpenAI

client = OpenAI()

def synthesize_speech(text, session_id):

    current_date = datetime.now().strftime("%Y%m%d")
    filename = f"{session_id}_{current_date}.mp3"
    s3_object_key = f"audio/{filename}"

    response = client.audio.speech.create(
        model="gpt-4o-mini-tts",      # 注意：openai 官方是 tts-1 或 tts-1-hd，如果你用 gpt-4o tts 要确认一下
        voice="alloy",      # 可选: alloy, shimmer, echo, fable, nova
        input=text
    )

    audio_bytes = response.content
    
    speech_file_path = os.path.join("uploads", filename)
    with open(speech_file_path, "wb") as f:
        f.write(audio_bytes)

    return audio_bytes
