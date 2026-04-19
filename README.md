# 🍱 NutriLens — AI Food Nutrition PWA

A minimal Progressive Web App that detects food from photos and returns Indian-serving-size nutrition data using AI.

## Tech Stack
- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** (dark theme, minimal UI)
- **HuggingFace Inference API** — `nateraw/food` model for food classification
- **Google Gemini 1.5 Flash** — nutrition data generation
- **@ducanh2912/next-pwa** — PWA with offline fallback

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env.local`
```bash
cp .env.local.example .env.local
```
Then fill in your keys:
```
HF_API_KEY=your_huggingface_api_key
GEMINI_API_KEY=your_gemini_api_key
```

**Get API keys:**
- HuggingFace: https://huggingface.co/settings/tokens (free)
- Gemini: https://aistudio.google.com/app/apikey (free tier available)

### 3. Run development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
npm start
```

## Features

### 📷 Camera Capture
- Opens device back camera (mobile-first)
- Live viewfinder with orange guide box
- Capture → preview → retake flow
- Graceful fallback to native camera input
- Proper permission error messaging

### 📁 Upload
- Tap-to-select or drag-and-drop
- Image preview before analysis
- Works on all devices

### 🤖 AI Pipeline
1. Image → HuggingFace `nateraw/food` → food label + confidence score
2. Food label → Gemini 1.5 Flash → structured nutrition JSON (Indian serving sizes)

### 📊 Results
- Food name (formatted from `fried_rice` → "Fried Rice")
- Confidence % with colour-coded bar
- Calories, Protein, Carbs, Fat, Fiber per serving
- Serving size estimate
- Top-3 alternative predictions

### 📱 PWA
- Installable on iOS & Android
- Offline fallback page
- Mobile-first responsive design
- Theme colour and splash screen

## Project Structure
```
app/
  api/
    predict/route.ts   — HuggingFace food classification
    nutrition/route.ts — Gemini nutrition lookup
  components/
    CameraCapture.tsx  — Live camera + capture UI
    UploadImage.tsx    — File upload + drag & drop
    ResultCard.tsx     — Nutrition display card
  page.tsx             — Main page (mode toggle, orchestration)
  layout.tsx           — PWA meta tags, fonts
  globals.css          — Design tokens, animations
public/
  manifest.json        — PWA manifest
  offline.html         — Offline fallback
```

## API Routes

### `POST /api/predict`
- Body: `FormData` with `image` field (File)
- Returns: `{ label, score, displayName, allPredictions }`

### `POST /api/nutrition`
- Body: `{ label: string }`
- Returns: `{ nutrition: { calories, protein, carbs, fat, fiber, servingSize } }`
