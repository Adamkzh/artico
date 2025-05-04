from fastapi import FastAPI, UploadFile, File, Form, Header, BackgroundTasks
from fastapi.responses import JSONResponse
import uuid
import os
import json

from gpt.gpt_client import generate_initial_description, continue_conversation
from gpt.tts_client import synthesize_speech
from model.ArtworkMetadata import ArtworkMetadata
from test import test_synthesize_speech
from utils.s3Server import upload_file_and_get_presigned_url, get_presigned_url_by_session_id

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/api/recognize")
async def upload_image(
        background_tasks: BackgroundTasks,
        image: UploadFile = File(...),
        language: str = Form(default="en"),
        role: str = Form(default="adult"),
):
    image_bytes = await image.read()
    session_id = str(uuid.uuid4())

    # 1. Generate initial structured data (parsed JSON)
    parsed_artworks_info:ArtworkMetadata = generate_initial_description(image_bytes=image_bytes, language=language, role=role)
    print(parsed_artworks_info)

    # 2. Add audio generation to background tasks
    # background_tasks.add_task(
    #     generate_and_store_audio,
    #     parsed_artworks_info.description,
    #     session_id
    # )

    # 3. Return immediate response with text only
    return JSONResponse({
        "session_id": session_id,
        "title": parsed_artworks_info.title,
        "artist": parsed_artworks_info.artist,
        "museum_name": parsed_artworks_info.museum_name,
        "description": parsed_artworks_info.description,
        "audio_description_url": None  # Will be available later via /api/audio_url
    })

@app.get("/api/audio_url")
async def get_audio_url(session_id: str):
    """
    Get the presigned URL for the audio file associated with the session_id.
    Returns None if the audio is not ready yet.
    """
    print("Called get_audio_url" + session_id)
    audio_url = get_presigned_url_by_session_id(session_id)
    return JSONResponse({"audio_url": audio_url})

def generate_and_store_audio(description: str, session_id: str):
    """
    Generate audio from description and upload to S3.
    This function runs in the background.
    """
    try:
        audio_bytes = synthesize_speech(description)
        upload_file_and_get_presigned_url(audio_bytes, session_id)
    except Exception as e:
        print(f"Error generating audio for session {session_id}: {e}")

@app.post("/api/followup")
async def ask_question(session_id: str = Form(...), user_input: str = Form(...)):
    # Get the latest audio file from S3 to continue the conversation
    latest_audio_url = get_presigned_url_by_session_id(session_id)
    if not latest_audio_url:
        return JSONResponse({"error": "No previous conversation found"}, status_code=404)
    
    # Continue the conversation
    reply = continue_conversation(user_input)
    
    # Generate and upload new audio
    audio_bytes = synthesize_speech(reply)
    audio_url = upload_file_and_get_presigned_url(audio_bytes, session_id)
    
    return JSONResponse({
        "reply": reply,
        "audio_url": audio_url
    })
    
@app.get("/test")
async def test():
    return {"audio_url": test_synthesize_speech()}
