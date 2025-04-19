# Artico - Art Exploration App

Artico is a mobile application that enables users to explore artworks through their phone camera. The app delivers a seamless, artistic, and immersive experience by combining visual artwork recognition, dynamic storytelling, and real-time audio narration.

## Features

- One-click artwork scanning
- Real-time camera processing
- Dynamic storytelling with typing animations
- Synchronized audio narration
- Local artwork collection management
- Dark mode interface
- Modern, minimalistic design

## Tech Stack

- React Native
- Expo
- TypeScript
- Expo Camera
- Expo Image Picker
- Expo Speech
- Expo Linear Gradient

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Run on iOS:
   ```bash
   npm run ios
   ```
5. Run on Android:
   ```bash
   npm run android
   ```

## Project Structure

```
artico/
├── app/                 # Main app screens
│   ├── (tabs)/         # Tab navigation
│   ├── camera.tsx      # Camera screen
│   ├── loading.tsx     # Loading screen
│   ├── result.tsx      # Result screen
│   └── _layout.tsx     # App layout
├── assets/             # Static assets
│   ├── fonts/          # Font files
│   └── images/         # Image assets
├── components/         # Reusable components
├── constants/          # App constants
└── scripts/           # Utility scripts
```

## User Flow

1. Splash Screen (1.5s)
2. Home Screen
   - Date and greeting display
   - Camera button
   - Artwork history
3. Camera Screen
   - Live camera preview
   - Capture button
   - Gallery picker
4. Loading Screen
   - Artwork recognition
   - Progress animation
5. Result Screen
   - Artwork display
   - Typing animation
   - Audio narration
   - Return to home

## Design Guidelines

- Dark mode primary theme
- Minimalistic and elegant aesthetic
- Modern sans-serif typography (Inter)
- Smooth animations and transitions
- Consistent spacing and layout

## License

MIT License
