# PriMed AI | Secure Medical Intelligence Hub

![Status](https://img.shields.io/badge/Status-Stable-green)
![Tech](https://img.shields.io/badge/Google-Gemini_Search_Maps-blue)
![AI](https://img.shields.io/badge/Powered_By-Gemini_2.5_Flash-purple)

**PriMed AI** is a specialized, secure, and compassionate medical triage assistant built for the "AI for Healthcare" challenge. It leverages **Google's Real-Time Intelligence Ecosystem** (Gemini + Search + Maps) to provide accurate, grounded medical advice and local specialist recommendations.

---


### 1. 🛠 Google Technology
*   **Gemini 2.5 Flash**: Utilizing the latest model for high-speed, multimodal reasoning.
*   **Google Search Grounding**: The AI connects to the live web to verify drug interactions and fetch up-to-date medical protocols (e.g., CDC guidelines), replacing hallucination with citation.
*   **Google Maps Grounding**: Integrates real-time location data to find actual clinics and specialists near the user, providing direct map links.

### 2. 💡 Innovation
*   **Privacy-First Architecture**: Unlike standard cloud chatbots, PriMed AI implements **Client-Side PII Redaction**. Emails and phone numbers are masked *before* data leaves the user's device.
*   **Dual-Persona System**: The AI dynamically shifts between a "Clinical Analyst" and an "Empathetic Counselor".

### 3. ⚡ Feasibility
*   **Zero-Backend Deployment**: Built as a lightweight React SPA. It requires no complex server infrastructure, making it instantly deployable.
*   **Real-World Ready**: Uses browser Geolocation API to serve relevant local results immediately.

### 4. 🌍 Impact
*   **Health Literacy**: Deciphers complex lab reports and handwritten prescriptions.
*   **Safety Net**: Dedicated **Emergency Detection Protocol**.
*   **Preventive Care**: Live-verified Drug Interaction Tool prevents dangerous medication combinations.

---

## 🌟 Key Features

1.  **Medical Document Analysis**: Upload a photo of a prescription or a PDF lab report. PriMed AI extracts the data and explains it in plain English.
2.  **Live Specialist Finder**: Ask "Find a cardiologist near me", and PriMed AI uses **Google Maps** to return a list of real, rated doctors with directions.
3.  **Verified Drug Checks**: Ask "Can I take X with Y?", and PriMed AI uses **Google Search** to cross-reference trusted medical databases.
4.  **Mental Health Support**: A safe space to discuss anxiety or stress with a validating, non-judgmental AI persona.

---

## 🏃‍♂️ How to Run

Follow these steps to get PriMed AI running in your local environment.

### 1. Prerequisites
*   **Node.js**: Ensure Node.js (v18+) is installed on your machine.
*   **Google API Key**: You need a Gemini API key. Get one for free at [Google AI Studio](https://aistudio.google.com/).

### 2. Installation
Clone the repository or download the files to a local folder.
```bash
# If using a package manager (optional, as this uses ES Modules via CDN)
npm install
```

### 3. Configuration (API Key)
The application requires the `API_KEY` environment variable.

**Mac/Linux:**
```bash
export API_KEY="your_actual_google_api_key"
```

**Windows (PowerShell):**
```powershell
$env:API_KEY="your_actual_google_api_key"
```

### 4. Start the Application
Run the development server. This will bundle the application and inject your API key.

```bash
npm start
```
*   Open your browser and navigate to `http://localhost:8080` (or the port shown in your terminal).

---

## ⚠️ Medical Disclaimer
PriMed AI is an **assistive tool** for informational purposes only. It is **not** a doctor.
- It cannot diagnose diseases.
- It cannot prescribe medication.
- Always verify information with a qualified healthcare professional.
- **In case of emergency, call your local emergency services immediately.**
