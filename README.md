<div align="center">

<!-- Replace this with an animated .gif or .webp demo of the UI -->
<img src="https://github.com/user-attachments/assets/3e912edf-92bb-4903-8e44-fb6d545033b7" width="100%" alt="AgriResolve AI Demo"/>

# AgriResolve AI

### Explainable AI for Early Crop Health Risk Assessment

<p align="center">
  <img src="https://img.shields.io/badge/Status-Online-success?style=for-the-badge" alt="Status"/>
  <img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash--Lite-blue?style=for-the-badge" alt="AI"/>
  <img src="https://img.shields.io/badge/Architecture-Multi--Agent-orange?style=for-the-badge" alt="Architecture"/>
  <img src="https://img.shields.io/badge/Languages-10%20Indian%20Languages-green?style=for-the-badge" alt="Languages"/>
</p>

</div>

---

# 🌾 Overview

**AgriResolve AI** is a multimodal crop health intelligence platform powered by a **Multi-Agent Consensus Architecture** built on **Gemini 2.5**.

Instead of relying on a single AI inference, specialized agents collaboratively analyze crop imagery, debate possible conditions, and generate an explainable confidence-weighted assessment for farmers and agronomists.

The system is designed for multilingual agricultural accessibility, explainable diagnostics, and scalable AI-assisted farming workflows.

> Architecture Note  
> The frontend never communicates directly with Gemini APIs. All AI requests are securely routed through a backend proxy (`/api/analysis`) to protect API credentials.

---

# ✨ Core Features

## 🧠 Multi-Agent Consensus Pipeline

AgriResolve AI uses a collaborative AI architecture:

- 👁️ **Vision Agent**  
  Performs image understanding and lesion analysis using Gemini Vision.

- 🛡️ **Healthy Hypothesis Agent**  
  Evaluates whether symptoms may result from environmental or abiotic causes.

- 🦠 **Disease Hypothesis Agent**  
  Investigates possible crop diseases and pathology indicators.

- ⚖️ **Arbitration Agent**  
  Resolves disagreements between agents and generates a confidence-weighted verdict.

- 📝 **Explanation Agent**  
  Produces actionable farmer-friendly guidance.

---

## 🌍 Multilingual Accessibility

Supports 10 Indian languages:

- English
- Hindi
- Telugu
- Tamil
- Malayalam
- Kannada
- Marathi
- Bengali
- Gujarati
- Punjabi

### Translation Architecture

- Stable English-first analysis pipeline
- Instant cached translation switching
- Zero additional API cost when changing languages
- Consistent multilingual UI rendering

---

## 🎮 Immersive Interface

- Premium Glassmorphism UI
- Gunmetal visual aesthetic
- Interactive 3D bio-network background
- Built using React Three Fiber and Framer Motion

---

## 📍 Context-Aware Agricultural Assistance

Optional geolocation support enables:

- Local weather-aware recommendations
- Seasonal disease correlation
- Irrigation timing suggestions
- Environmental risk contextualization

Weather data is fetched through **Open-Meteo** without requiring additional API keys.

---

## 🎙️ Voice Interaction

### Speech-to-Text
Voice input using browser Web Speech API.

### Text-to-Speech
AI responses can be spoken in the currently selected language.

---

## 🛡️ Safety Guardrails

The system refuses unsafe agricultural instructions such as:
- hazardous chemical mixing
- unsafe dosage recommendations
- harmful agricultural misuse

Safer alternatives and next-step guidance are provided instead.

---

# 🛠️ Tech Stack

## Frontend
- React 19
- Vite 6
- TypeScript
- Tailwind CSS v4
- Framer Motion
- React Three Fiber
- Maath

## Backend
- Node.js
- Express

## AI Integration
- Google Gemini 2.5 Flash-Lite
- `@google/genai`

## Internationalization
- i18next
- react-i18next

---

# 🚀 Quick Start

<details>
<summary><b>1. Clone Repository</b></summary>

```bash
git clone https://github.com/yourusername/AgriResolve-AI.git
cd AgriResolve-AI
```

</details>

---

<details>
<summary><b>2. Install Dependencies</b></summary>

```bash
npm install
```

</details>

---

<details>
<summary><b>3. Configure Frontend Environment</b></summary>

Create `.env.local`

```env
VITE_API_URL=http://localhost:3001

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

</details>

---

<details>
<summary><b>4. Configure Backend Environment</b></summary>

Create `.env`

```env
GEMINI_API_KEY=your_gemini_api_key

SESSION_SECRET=your_secure_secret

CLIENT_URL=http://localhost:5173

PORT=3001
```

</details>

---

<details>
<summary><b>5. Run the Application</b></summary>

### Terminal 1 — Backend

```bash
npm run build:server
npm run start:server
```

### Terminal 2 — Frontend

```bash
npm run dev
```

</details>

---

# 🧪 Health Endpoints

```http
GET /api/health
GET /api/health/gemini
POST /api/analysis
```

---

# 🌐 Deployment

## Frontend Deployment
Recommended: Vercel

### Build Command

```bash
npm run build
```

### Output Directory

```bash
dist
```

---

## Backend Deployment
Recommended: Render

Required environment variables:

```env
GEMINI_API_KEY=
SESSION_SECRET=
CLIENT_URL=
```

---

# ⚠️ Quota & Billing

Gemini 2.5 free tier usage is limited.

If you encounter quota issues:

- Link a billing account to your Google Cloud project
- Use Pay-As-You-Go pricing
- Gemini token costs remain extremely low for production-scale experimentation

---

# 🧯 Troubleshooting

## 503 Error (`/api/analysis`)

Gemini API may be unreachable.

Verify:
- `GEMINI_API_KEY`
- backend deployment status
- `/api/health/gemini`

---

## Quota Exceeded

The Gemini free tier has strict request limits.

Enable billing on Google Cloud to remove restrictions.

---

## Blank Screen After Deploy

Possible stale service worker issue.

Fix:
1. Open DevTools
2. Navigate to Application → Service Workers
3. Unregister old workers
4. Clear site data
5. Reload application

---

# ❤️ Vision

AgriResolve AI aims to make advanced agricultural intelligence accessible, explainable, and multilingual for farmers across diverse agricultural ecosystems.

Built for precision agriculture and AI-assisted farming workflows.
