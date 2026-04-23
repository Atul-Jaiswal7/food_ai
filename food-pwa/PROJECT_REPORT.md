# NutriLens Technical Project Report

## 1. Executive Summary
NutriLens is an AI-driven nutrition tracking application designed to bridge the gap between complex diet logging and user convenience. By leveraging advanced Computer Vision (CV) and Large Language Models (LLMs), the platform automates the tedious task of manual calorie counting, providing users with a premium, seamless experience.

## 2. System Architecture

### 2.1 Frontend Architecture
Built on **Next.js 14**, the application utilizes the **App Router** for optimized routing and server-side rendering where applicable.
- **State Management**: React `useState` and `useMemo` for local state; Context API for global preferences (e.g., Language).
- **UI System**: A custom CSS variable-based design system supporting "Glassmorphism" and high-end aesthetics.
- **Responsive Design**: Mobile-first approach targeting PWA (Progressive Web App) standards.

### 2.2 Backend Architecture
The backend is composed of **Next.js API Routes** (Route Handlers) acting as a serverless middle-layer.
- **Database**: **MongoDB** was selected for its schema-less flexibility, allowing for evolving nutrition data structures.
- **Authentication**: A custom implementation using JWT (JSON Web Tokens) and secure cookies for session persistence without external providers like NextAuth, ensuring full control over user data.

## 3. AI & Data Intelligence Layer

### 3.1 The Detection Pipeline
NutriLens employs a sophisticated multi-stage fallback strategy to ensure high availability and accuracy:
1. **Primary (Google Gemini 2.5 Flash)**: Handles multi-modal analysis (image + text) to identify food and estimate nutrition in one pass.
2. **Secondary (Hugging Face + Grok)**: 
   - **Stage A**: Hugging Face's `nateraw/food` model identifies the food labels from the image.
   - **Stage B**: The identified labels are passed to Grok (X.AI) to estimate nutritional values based on general knowledge and Indian food context.

### 3.2 Nutrition Accuracy
The system calculates nutrition based on two parameters:
- **Portion**: A multiplier (e.g., 1.5 plates).
- **Quantity**: Physical weight in grams.
Recalculations are triggered dynamically when a user adjusts either value in the `ResultCard`.

## 4. Database Schema Detail

### 4.1 Users Collection
- `id`: UUID
- `name`, `email`, `passwordHash`: Core credentials.
- `profile`: Object containing `age`, `height`, `weight`, `gender`, and `intakeTargets`.

### 4.2 Meals Collection
- `id`: Unique record ID.
- `groupId`: Links multiple items from a single scan (e.g., Dal + Rice).
- `groupName`: Friendly name for the meal session.
- `nutrients`: Full breakdown (Calories, Protein, Carbs, Fat, Fiber, Sugar, etc.).
- `micros`: Specialized fields for Sodium, Potassium, etc.
- `createdAt`: ISO timestamp for historical filtering.

## 5. Feature Breakdown

### 5.1 Real-time Analysis
Uses `multipart/form-data` to stream images to the API, which are then processed as Base64 for the Gemini model.

### 5.2 Dashboard & Analytics
- **Macro Distribution**: Conic-gradient visualizations for daily protein, carb, and fat ratios.
- **Progress Tracking**: Real-time comparison against user-defined goals.
- **Streak Engine**: Server-side logic to track consecutive logging days.

### 5.3 Meal History (Log)
- **Advanced Filtering**: Client-side filtering logic for "Today", "Week", and "Month" views using `useMemo` for performance.
- **Interactive Details**: Nested components allowing deep-dives into specific ingredients within a meal group.

## 6. Security & Performance
- **Image Optimization**: Validates MIME types and limits file size (8MB) before processing.
- **Auth Security**: Password hashing using standard cryptographic practices.
- **API Protection**: `requireUser` middleware protects sensitive routes from unauthorized access.

## 7. Future Roadmap
- **OCR Integration**: Scanning physical nutrition labels.
- **Social Features**: Sharing meal streaks with friends.
- **Wearable Sync**: Integrating with Apple Health or Google Fit.
