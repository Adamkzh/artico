from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uuid
import os

from session_store import init_session, get_session_history, update_session
from gpt_client import generate_initial_description, continue_conversation
from tts_client import synthesize_speech
from test import test_synthesize_speech

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    session_id, history, description = generate_initial_description(image_bytes)
    update_session(session_id, history)
    audio_path = synthesize_speech(description, session_id)
    return JSONResponse({
        "session_id": session_id,
        "description": description,
        "audio_url": audio_path
    })

@app.post("/ask")
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
    test_synthesize_speech()
    return {"message": "Test successful"}