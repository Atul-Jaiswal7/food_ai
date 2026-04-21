# NutriLens: AI-Powered Food Tracker

NutriLens is a modern, premium Progressive Web Application (PWA) designed to simplify nutrition tracking using state-of-the-art AI. Users can scan their meals through images or manual entry to get instant nutritional breakdowns and track their progress over time.

## 🚀 Key Features

### 1. AI-Powered Food Recognition
- **Dual-Provider Analysis**: Uses Google Gemini 2.5 Flash as the primary engine with a multi-model fallback system (Hugging Face + Grok/X.AI).
- **Multi-Item Detection**: Recognizes multiple food items within a single image and provides individual nutrient breakdowns.
- **Portion Estimation**: Intelligently estimates portion sizes and allows users to fine-tune quantities in grams.

### 2. Comprehensive Nutrient Tracking
- **Macro Nutrients**: Tracks Calories, Protein, Carbohydrates, Fats, Fiber, and Sugar.
- **Micro Nutrients**: Tracks essential minerals and vitamins including Sodium, Potassium, Calcium, Iron, Vitamin A, and Vitamin C.
- **Interactive Dashboards**: Visualizes daily intake vs. targets with dynamic progress rings and macro breakdowns.

### 3. Smart Meal Log
- **Historical Records**: Grouped meal view showing scanned items and their total nutritional value.
- **Detailed Item Breakdown**: Expandable meal cards to view specific nutrients for every ingredient.
- **Time Filtering**: Quickly filter history by "Today", "Week", and "Month".

### 4. Personalization & Gamification
- **User Profiles**: Customized intake targets based on age, height, weight, and gender.
- **Streak System**: Encourages consistency with a 7-day streak tracker.
- **Auth System**: Secure signup and login functionality.

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS + Tailwind CSS (for layout utilities)
- **Database**: MongoDB (via `mongodb` driver)
- **AI Models**: 
  - Primary: Google Gemini 2.5 Flash
  - Fallback 1: Hugging Face (Food Recognition)
  - Fallback 2: Grok/X.AI (Nutrition Estimation)
- **Authentication**: Custom JWT-based session management

## 📁 Project Structure

```text
├── app/             # Next.js App Router root
│   ├── api/         # Backend API routes
│   ├── components/  # Reusable UI components
│   ├── dashboard/   # User metrics and progress
│   ├── meal-log/    # Meal history and filtering
│   ├── profile/     # User settings and targets
│   └── page.tsx     # Scanner Home page
├── lib/             # Core logic, DB helpers, and types
├── public/          # Static assets and icons
└── styles/          # Global styles and design tokens
```

## ⚙️ Environment Variables

To run the project locally, create a `.env` file with the following:

```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
GROK_API_KEY=your_xai_api_key
HF_API_KEY=your_huggingface_api_key
FATSECRET_CLIENT_ID=your_fatsecret_id
FATSECRET_CLIENT_SECRET=your_fatsecret_secret
JWT_SECRET=your_secure_random_string
```

## 📦 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run in development**:
    ```bash
    npm run dev
    ```
3.  **Build for production**:
    ```bash
    npm run build
    ```

## ✨ Design Philosophy

NutriLens features a **premium, mobile-first design** with:
- **Glassmorphism**: Blurred navigation and surface treatments.
- **Micro-animations**: Smooth interactions and hover effects.
- **Dynamic Palettes**: Consistent use of brand accents (`--accent`) for a cohesive feel.
- **Accessibility**: Semantic HTML and descriptive ARIA labels.
