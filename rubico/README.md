# Artico - AI-Powered Art Description and Audio Generator

Artico is a FastAPI-based application that leverages OpenAI's GPT models to generate detailed descriptions of artworks and convert them into audio files. The application supports multiple languages, allowing users to interact with the system in their preferred language. It provides endpoints for image recognition, follow-up questions, and text-to-speech synthesis.

---

## Features

- **Image Recognition**: Upload an image to generate a detailed description of the artwork.
- **Follow-Up Questions**: Ask questions about the artwork and receive AI-generated responses.
- **Text-to-Speech**: Convert generated descriptions or responses into audio files.
- **Language Support**: Translate descriptions into multiple languages using `deep-translator`.
- **AWS S3 Integration**: Upload audio files to S3 and retrieve presigned URLs for access.

---

## Installation

### Prerequisites
- Python 3.9 or higher
- `pip` (Python package manager)
- AWS credentials (for S3 integration)

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rubico
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirement.txt
   ```

4. Set up environment variables for AWS (if using S3):
   ```bash
   export AWS_ACCESS_KEY_ID=<your-access-key>
   export AWS_SECRET_ACCESS_KEY=<your-secret-key>
   export AWS_REGION=<your-region>
   ```

---

## Usage

### Starting the Server
Run the FastAPI server using `uvicorn`:
```bash
uvicorn app:app --reload
```

The server will start at `http://127.0.0.1:8000`.

### API Endpoints

#### 1. **Image Recognition**
- **Endpoint**: `/recognize`
- **Method**: `POST`
- **Description**: Upload an image to generate a description and audio file.
- **Request**:
  - `file`: Image file (e.g., `.jpg`, `.png`)
- **Response**:
  ```json
  {
    "session_id": "unique-session-id",
    "description": "Generated description of the artwork",
    "audio_url": "Presigned URL for the audio file"
  }
  ```

#### 2. **Follow-Up Questions**
- **Endpoint**: `/followup`
- **Method**: `POST`
- **Description**: Ask a follow-up question about the artwork.
- **Request**:
  - `session_id`: The session ID from the `/recognize` endpoint.
  - `user_input`: The question to ask.
- **Response**:
  ```json
  {
    "reply": "AI-generated response",
    "audio_url": "Presigned URL for the audio file"
  }
  ```

#### 3. **Test Endpoint**
- **Endpoint**: `/test`
- **Method**: `GET`
- **Description**: Test the text-to-speech functionality.
- **Response**:
  ```json
  {
    "message": "Test successful"
  }
  ```

---

## Project Structure

```
rubico/
├── app.py                 # Main FastAPI application
├── gpt/
│   ├── gpt_client.py      # Handles GPT interactions
│   ├── prompt.py          # Generates prompts for GPT
│   └── tts_client.py      # Handles text-to-speech synthesis
├── language/
│   └── language.py        # Language translation utilities
├── utils/
│   └── s3uploader.py      # AWS S3 integration for file uploads
├── test.py                # Test functions for the application
├── requirement.txt        # Python dependencies
└── README.md              # Project documentation
```

---

## Testing

To test the text-to-speech functionality, call the `/test` endpoint:
```bash
curl -X GET http://127.0.0.1:8000/test
```

---

## Deployment

### Docker Deployment
1. Create a `Dockerfile`:
   ```dockerfile
   FROM python:3.9-slim
   WORKDIR /app
   COPY . .
   RUN pip install -r requirement.txt
   CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. Build and run the Docker container:
   ```bash
   docker build -t artico .
   docker run -p 8000:8000 artico
   ```

### Cloud Deployment
You can deploy the application to cloud platforms like AWS, Azure, or Google Cloud using their respective container services or serverless frameworks.

---

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.