# Artico - AI-Powered Art Exploration Platform

Artico is a comprehensive art exploration platform that combines mobile app technology, AI-powered backend services, and machine learning image recognition to deliver an immersive museum experience. Users can scan artworks with their phone camera and receive detailed descriptions, audio narrations, and interactive conversations about the art.


https://github.com/user-attachments/assets/17f3c60a-a2e0-4ea1-a1ff-d77af61b97b2


## 🏗️ Architecture Overview

The Artico platform consists of three main components:

1. **artico** - React Native mobile application (iOS/Android)
2. **rubico** - FastAPI backend service with AI integration
3. **ML platform** - CLIP-based image matching and gallery management system

```
┌─────────────────┐
│   Mobile App    │  (artico)
│  (React Native) │
└────────┬────────┘
         │ HTTP/REST API
         ▼
┌─────────────────┐
│  Backend API    │  (rubico)
│   (FastAPI)     │
│  - GPT Models   │
│  - TTS Service  │
│  - S3 Storage   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ML Platform    │  (ML platform)
│  - CLIP Model   │
│  - Gallery DB   │
│  - Embeddings   │
└─────────────────┘
```

---

## 📱 Component 1: artico (Mobile App)

A React Native mobile application built with Expo that provides the user interface for artwork exploration.

### Features

- **One-click artwork scanning** - Capture artwork images using the device camera
- **Real-time image processing** - Compress and upload images to the backend
- **Dynamic storytelling** - Typing animations for artwork descriptions
- **Synchronized audio narration** - Text-to-speech audio playback
- **Local artwork collection** - SQLite database for saved artworks
- **Multi-language support** - Interface and content in multiple languages
- **Role-based content** - Different descriptions for adults and children
- **Dark mode interface** - Modern, minimalistic design
- **Interactive chat** - Follow-up questions about artworks

### Tech Stack

- **React Native** with Expo
- **TypeScript**
- **Expo Router** - File-based routing
- **Expo Camera** - Camera functionality
- **Expo SQLite** - Local database
- **Expo Speech** - Audio playback
- **React Navigation** - Navigation system

### Setup Instructions

1. Navigate to the artico directory:
   ```bash
   cd artico
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the backend IP address in `artico/utils/config.ts`:
   ```typescript
   export const IP_ADDRESS = 'YOUR_BACKEND_IP';
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on iOS:
   ```bash
   npm run ios
   ```

6. Run on Android:
   ```bash
   npm run android
   ```

### Project Structure

```
artico/
├── app/                    # Main app screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   ├── camera.tsx          # Camera capture screen
│   ├── artwork/[id].tsx    # Artwork detail screen
│   ├── collection/         # User's saved artworks
│   ├── profile.tsx         # User profile
│   └── _layout.tsx        # Root layout
├── components/             # Reusable UI components
├── services/              # API integration services
│   ├── artwork.ts         # Artwork recognition API
│   ├── audio.ts           # Audio polling service
│   └── chat.ts            # Chat/follow-up API
├── database/              # SQLite database schemas
├── utils/                 # Utility functions
│   ├── config.ts          # Configuration (IP address)
│   └── i18n/              # Internationalization
└── assets/                # Static assets (fonts, images)
```

### User Flow

1. **Splash Screen** → Brief loading animation
2. **Home Screen** → Date, greeting, camera button, artwork history
3. **Camera Screen** → Live preview, capture button, gallery picker
4. **Loading Screen** → Artwork recognition in progress
5. **Artwork Detail Screen** → Image display, typing animation, audio narration
6. **Chat Interface** → Interactive Q&A about the artwork
7. **Collection** → Browse saved artworks

---

## 🔧 Component 2: rubico (Backend API)

A FastAPI-based backend service that provides AI-powered artwork analysis, description generation, and text-to-speech capabilities.

### Features

- **Image Recognition** - Analyze uploaded artwork images using GPT vision models
- **Structured Metadata Extraction** - Extract title, artist, museum, and description
- **Multi-language Support** - Generate descriptions in multiple languages
- **Role-based Content** - Adapt descriptions for adults vs. children
- **Text-to-Speech** - Convert descriptions to audio files
- **AWS S3 Integration** - Store and serve audio files via presigned URLs
- **Follow-up Conversations** - Context-aware Q&A about artworks
- **Background Processing** - Async audio generation for better performance

### Tech Stack

- **FastAPI** - Modern Python web framework
- **OpenAI GPT** - Vision and chat models for artwork analysis
- **Google TTS / gTTS** - Text-to-speech synthesis
- **AWS S3** - Audio file storage
- **Pydantic** - Data validation
- **deep-translator** - Language translation

### Setup Instructions

1. Navigate to the rubico directory:
   ```bash
   cd rubico
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirement.txt
   ```

4. Set up environment variables:
   ```bash
   export OPENAI_API_KEY=your_openai_api_key
   export AWS_ACCESS_KEY_ID=your_aws_access_key
   export AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   export AWS_REGION=your_aws_region
   ```

5. Start the server:
   ```bash
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

The server will be available at `http://localhost:8000`

### API Endpoints

#### 1. Image Recognition
- **Endpoint**: `POST /api/recognize`
- **Description**: Upload an image to generate artwork description and metadata
- **Request**:
  - `image`: Image file (multipart/form-data)
  - `language`: Language code (default: "en")
  - `role`: User role - "adult" or "child" (default: "adult")
- **Response**:
  ```json
  {
    "session_id": "uuid",
    "title": "Artwork Title",
    "artist": "Artist Name",
    "museum_name": "Museum Name",
    "description": "Detailed description...",
    "audio_description_url": null
  }
  ```

#### 2. Get Audio URL
- **Endpoint**: `GET /api/audio_url?session_id={session_id}`
- **Description**: Retrieve the presigned URL for the generated audio file
- **Response**:
  ```json
  {
    "audio_url": "https://s3.amazonaws.com/..."
  }
  ```

#### 3. Follow-up Questions
- **Endpoint**: `POST /api/followup`
- **Description**: Ask follow-up questions about an artwork
- **Request**:
  ```json
  {
    "user_input": "Tell me more about the technique",
    "artwork_name": "Artwork Title",
    "artwork_artist": "Artist Name",
    "artwork_museum": "Museum Name",
    "message_history": [
      {"role": "user", "content": "..."},
      {"role": "assistant", "content": "..."}
    ]
  }
  ```
- **Response**:
  ```json
  {
    "reply": "AI-generated response..."
  }
  ```

### Project Structure

```
rubico/
├── app.py                    # Main FastAPI application
├── ai_client/                # AI client implementations
│   ├── client_factory.py     # Factory for creating AI clients
│   ├── client.py             # Base client interface
│   ├── gpt_client.py         # OpenAI GPT implementation
│   ├── gemini_client.py      # Google Gemini implementation
│   ├── tts_client.py         # Text-to-speech client
│   └── promptGenerator.py    # Prompt generation utilities
├── model/                    # Data models
│   └── ArtworkMetadata.py    # Artwork metadata structure
├── language/                 # Language utilities
│   └── language.py           # Translation functions
├── utils/                    # Utility modules
│   └── s3Server.py           # AWS S3 integration
├── sessions/                 # Session storage (JSON files)
├── uploads/                  # Temporary audio file storage
└── requirement.txt           # Python dependencies
```

---

## 🤖 Component 3: ML Platform

A machine learning system that uses CLIP (Contrastive Language-Image Pre-training) to match user-uploaded images with artworks in a curated gallery database.

### Features

- **CLIP-based Image Matching** - Semantic similarity search using OpenAI's CLIP model
- **Gallery Embedding Generation** - Pre-compute embeddings for artwork gallery
- **Metadata Management** - CSV-based artwork metadata storage
- **Batch Processing** - Efficient processing of large image collections
- **Ambrosiana Collection** - Pre-configured with Ambrosiana museum artworks

### Tech Stack

- **PyTorch** - Deep learning framework
- **Transformers** - Hugging Face CLIP model
- **PIL/Pillow** - Image processing
- **Pandas** - Data management
- **BeautifulSoup** - Web scraping (for gallery collection)

### Setup Instructions

1. Navigate to the ML platform directory:
   ```bash
   cd "ML platform"
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. (Optional) Scrape artwork metadata:
   ```bash
   python crawler.py
   ```

5. Build the gallery embeddings:
   ```bash
   python build_clip_gallery.py
   ```

   This will:
   - Load artwork images from `ambrosiana_images/`
   - Process metadata from `ambrosiana_metadata.csv`
   - Generate CLIP embeddings for each image
   - Save embeddings to `clip_gallery_embeddings.pkl`

6. Test image matching:
   ```bash
   python clip_match_user_upload.py
   ```

### Project Structure

```
ML platform/
├── build_clip_gallery.py          # Build gallery embeddings
├── clip_match_user_upload.py      # Match user images to gallery
├── crawler.py                     # Scrape artwork metadata
├── ambrosiana_metadata.csv        # Artwork metadata
├── clip_gallery_embeddings.pkl    # Pre-computed embeddings
├── ambrosiana_images/             # Artwork image collection
└── requirements.txt               # Python dependencies
```

### How It Works

1. **Gallery Building** (`build_clip_gallery.py`):
   - Loads artwork images and metadata
   - Processes images through CLIP model
   - Generates normalized embeddings
   - Saves embeddings with metadata to pickle file

2. **Image Matching** (`clip_match_user_upload.py`):
   - Loads pre-computed gallery embeddings
   - Processes user-uploaded image through CLIP
   - Computes cosine similarity with all gallery embeddings
   - Returns best matching artwork with similarity score

---

## 🔄 System Integration

### Data Flow

1. **User captures artwork** → Mobile app (artico)
2. **Image uploaded** → Backend API (rubico) `/api/recognize`
3. **GPT analyzes image** → Generates structured metadata and description
4. **Audio generated** → Background task creates TTS audio
5. **Response returned** → Mobile app displays description
6. **Audio polling** → Mobile app polls `/api/audio_url` until ready
7. **Audio playback** → User listens to narration
8. **Follow-up questions** → `/api/followup` endpoint for interactive chat

### Configuration

#### Mobile App Configuration
Edit `artico/utils/config.ts`:
```typescript
export const IP_ADDRESS = '192.168.1.21'; // Your backend server IP
```

#### Backend Configuration
Set environment variables for:
- OpenAI API key
- AWS credentials (for S3)
- Server host and port

---

## 🚀 Deployment

### Mobile App (artico)

#### Development
```bash
cd artico
npm start
```

#### Production Build
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

### Backend (rubico)

#### Docker Deployment
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY . .
RUN pip install -r requirement.txt
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t rubico .
docker run -p 8000:8000 --env-file .env rubico
```

#### Cloud Deployment
- Deploy to AWS, Azure, or Google Cloud
- Use container services (ECS, Cloud Run, etc.)
- Configure environment variables
- Set up S3 bucket for audio storage

### ML Platform

The ML platform is typically run as a one-time setup to build the gallery embeddings. The embeddings file can be integrated into the backend service for real-time image matching.

---

## 📋 Prerequisites

### For Mobile App (artico)
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android)

### For Backend (rubico)
- Python 3.9+
- OpenAI API key
- AWS account (for S3 storage)
- pip

### For ML Platform
- Python 3.9+
- CUDA-capable GPU (optional, for faster processing)
- pip

---

## 🧪 Testing

### Mobile App
```bash
cd artico
npm test
```

### Backend API
Test endpoints using curl or Postman:
```bash
# Test recognition
curl -X POST http://localhost:8000/api/recognize \
  -F "image=@test.jpg" \
  -F "language=en" \
  -F "role=adult"
```

### ML Platform
```bash
cd "ML platform"
python clip_match_user_upload.py
```

---

## 📝 Environment Variables

### Backend (rubico)
```bash
OPENAI_API_KEY=your_openai_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-2
S3_BUCKET_NAME=your-bucket-name
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- OpenAI for GPT and CLIP models
- Expo team for React Native tooling
- FastAPI for the excellent web framework
- Ambrosiana Library for artwork collection

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

