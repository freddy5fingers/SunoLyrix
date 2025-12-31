# SunoLyrix - Pro AI Lyric Architect

SunoLyrix is a high-fidelity songwriting studio designed to bridge the gap between human creativity and AI music generation. It specifically targets **Suno AI (v3.5/v4)** and other similar platforms by generating structurally sound, meta-tagged lyrics paired with custom sonic metadata and AI-generated album art.

## 🚀 Key Features

- **Live Streaming Composition**: Watch your song build in real-time using Gemini 3 Pro's streaming capabilities.
- **Modular Regeneration**: Don't like a specific verse? Use the **Redo** button next to any section (`[Verse]`, `[Chorus]`, etc.) to rewrite just that part while keeping the rest of the song intact.
- **Sonic DNA Profiling**: Configure "Vocal Textures" and "Instrumental Profiles" or let the AI auto-determine the best fit based on your genre and mood.
- **Artist Influence Database**: Emulate the lyrical vocabulary and rhythmic patterns of legendary North American artists (Pop, Hip Hop, Rock, Country, etc.).
- **AI Cover Art**: Automatically generates high-quality 1:1 album covers based on your song's title and vibe.
- **Cloud Library**: Securely save your compositions to a personal library using **Firebase Auth** and **Firestore**.

## 🛠️ Tech Stack

- **Frontend**: React (ES6 Modules), Tailwind CSS
- **Intelligence**: Google Gemini API (`@google/genai`)
  - `gemini-3-pro-preview` for sophisticated lyric streaming.
  - `gemini-3-flash-preview` for lightning-fast section regeneration.
  - `gemini-2.5-flash-image` for album art generation.
- **Backend/Database**: Firebase (Auth & Firestore)
- **Icons & Fonts**: FontAwesome 6, Google Fonts (Inter & Playfair Display)

## 📁 Project Structure

```text
├── App.tsx                # Main application logic & Firebase integration
├── firebase.ts           # Firebase initialization (Auth/Firestore)
├── constants.ts          # Curated lists of artists, genres, and styles
├── types.ts              # TypeScript interfaces for songs and params
├── services/
│   └── geminiService.ts  # Logic for AI text and image generation
└── components/
    └── LyricDisplay.tsx  # Smart component for parsing and rendering song blocks
```

## ⚙️ Environment Configuration

The application requires the following environment variables to be configured:

- `process.env.API_KEY`: Your Google Gemini API Key.
- `process.env.FIREBASE_API_KEY`: Your Firebase project API Key.

## 📝 Usage

1. **Configure**: Enter a theme and select your genre/mood in the Studio Controls.
2. **Refine**: (Optional) Pick an artist influence or customize the Sonic DNA.
3. **Generate**: Click "Stream Masterpiece".
4. **Edit**: Use the "Redo" buttons on specific blocks to fine-tune the output.
5. **Save**: Sign in with Google to store your creations in the "My Studio Library".
6. **Deploy**: Use the "Copy for Suno" button to get the optimized prompt for Suno AI's Custom Mode.

---
*Optimized for professional AI music production.*
