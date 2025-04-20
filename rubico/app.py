from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uuid
import os

from session_store import init_session, get_session_history, update_session
from gpt.gpt_client import generate_initial_description, continue_conversation
from gpt.tts_client import synthesize_speech
from test import test_synthesize_speech
from utils.s3uploader import upload_file_and_get_presigned_url

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/recognize")
async def upload_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    session_id = str(uuid.uuid4())
    
    description = generate_initial_description(image_bytes)
    audio_bytes = synthesize_speech(description)
    presigned_url = upload_file_and_get_presigned_url(audio_bytes, session_id)
    
    return JSONResponse({
        "session_id": session_id,
        "description": description,
        "audio_url": presigned_url
    })

@app.post("/followup")
async def ask_question(session_id: str = Form(...), user_input: str = Form(...)):
    history = get_session_history(session_id)
    print(history)
    reply, updated_history = continue_conversation(history, user_input)
    update_session(session_id, updated_history)
    audio_path = synthesize_speech(reply, session_id)
    return JSONResponse({
        "reply": reply,
        "audio_url": audio_path
    })
    
@app.get("/test")
async def test():
    return {"audio_url": test_synthesize_speech()}