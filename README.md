# ReflectAI: Authenticated Reflection & Journaling App

ReflectAI is a full-stack, user-authenticated journaling and reflective conversation web application built with **React**, **Express**, **Google Cloud Firestore**, and the **Gemini 3.6 Flash API** via the `@google/genai` SDK.

---

## 1. System Architecture & Threat Model Overview

ReflectAI is engineered with strict zero-trust tenancy boundaries:
- **Authentication**: Firebase Authentication (Google Sign-In with popup).
- **Backend Service**: Express.js server providing defensive payload ingestion, input sanitization, and server-side Gemini API proxying.
- **AI Processing Engine**: Server-side Gemini 3.6 Flash with an automated 4-model fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) recovering from transient 503/429/500 faults.
- **Database & Tenant Isolation**: Cloud Firestore storing multi-turn user reflections under `/users/{userId}/interactions/{interactionId}`, guarded by strict Attribute-Based Access Control (ABAC) rules.
- **Secret Management**: Google Cloud Secret Manager or environment variables injecting `GEMINI_API_KEY` exclusively into the server runtime.

---

## 2. Prerequisites & Environment Setup

1. **Install Google Cloud SDK & Firebase CLI**:
   ```bash
   gcloud components install beta
   npm install -g firebase-tools
   ```

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable Required Google Cloud APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com
   ```

---

## 3. Secret Management Setup (Secret Manager)

Store your Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run compute runtime service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Retrieve your Google Cloud Project Number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# 3. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Firestore Security Configuration

ReflectAI enforces strict owner-bound tenant isolation. Deploy the following security rules (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules to your project:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   VITE_FIREBASE_API_KEY="your-firebase-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project"
   VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
   VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 6. Cloud Run Deployment Flow

Deploy ReflectAI directly to Cloud Run from source, binding the `GEMINI_API_KEY` secret:

```bash
# Build and deploy container to Cloud Run
gcloud run deploy reflectai-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

---

## 7. Mandatory Campaign Labeling

Apply the mandatory challenge verification label to your deployed Cloud Run service:

```bash
gcloud run services update reflectai-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 8. Verification & Test Walkthrough Checklist

| Case ID | Feature Scope | Step-by-Step Test Procedure | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Landing & Auth Prompt | 1. Navigate to `/`.<br>2. Verify sign-in CTAs. | Landing page renders with Google Sign-in button. |
| **TC-02** | Google Authentication | 1. Click "Sign In with Google" or "Test Preview Session". | User is authenticated and navigated to private dashboard. |
| **TC-03** | Multi-Turn Reflection | 1. Select "Mindful Reflection" mode.<br>2. Submit reflection prompt. | Gemini replies empathetically; multi-turn transcript displays. |
| **TC-04** | Resilient Model Fallback | 1. Trigger API request with simulated rate limit. | Ladder attempts `gemini-3.6-flash`, fallback models in order. |
| **TC-05** | Firestore Isolation | 1. Submit prompt.<br>2. Verify save indicator. | Document is written to `/users/{userId}/interactions/{interactionId}`. |
| **TC-06** | Executive Summarization | 1. Click "Summarize" on an active conversation. | Gemini generates structured key themes and takeaways. |
| **TC-07** | Past History & Resume | 1. Click "History" panel.<br>2. Select a previous entry. | Past dialogue is retrieved and rendered; user can continue chatting. |
| **TC-08** | Transaction Verification | 1. Disconnect network and submit prompt. | Error alert displays with "Retry" button; input buffer preserved. |
| **TC-09** | Markdown Export | 1. Click "Export as Markdown". | `.md` file containing entire reflection transcript downloads. |
| **TC-10** | Location-Aware Maps | 1. Click "Tag Location" on an entry or click "Map Explorer" in top nav.<br>2. Explore interactive world map with pinned reflections.<br>3. Click a pin to view location and jump into the entry. | Map displays pins, reverse-geocoded addresses, and interactive infowindows with seamless entry jumping. |
| **TC-11** | Admin Console & RBAC | 1. Sign in as `samshaikh5853@gmail.com` (or toggle to Admin in top nav).<br>2. Click "Admin Console".<br>3. Inspect Fallback Ladder telemetry & 5 Threat Zones compliance.<br>4. Toggle to Standard User and verify Admin button hides. | Admin console displays live server metrics, model ladder status, and enforces RBAC isolation. |
| **TC-12** | External Notifications | 1. Open Admin Console &rarr; "External Notifications".<br>2. Select Discord/Slack/Email and input webhook (or leave empty for digest simulation).<br>3. Click "Dispatch Test Notification". | Webhook payload is dispatched or simulated with live confirmation badge. |
| **TC-13** | Voice/Audio Capture & Tone Analysis | 1. Click "Voice Journal" in header or inline microphone icon in chat input.<br>2. Grant microphone access and speak freely.<br>3. Observe real-time audio waveform visualizer and streaming speech transcript.<br>4. Click "Analyze & Transcribe".<br>5. Verify detected cognitive tone badge (e.g., reflective, focused, calm) and clarity score.<br>6. Click "Insert into Journal Prompt" to apply to active reflection. | Voice is captured via Web MediaRecorder, analyzed by Gemini 3.6 Flash multimodal audio, cognitive tone is extracted, and transcript is inserted into journal prompt. |
| **TC-14** | Cognitive Trend Dashboard & Heatmap | 1. Click "Cognitive Trends" in top header.<br>2. Explore the 16-Week Reflection Activity Heatmap matrix.<br>3. Click any date cell to view logged reflections and word count, with one-click jump to that entry.<br>4. Switch to "AI Cognitive Synthesis" tab and click "Synthesize Patterns".<br>5. Verify cognitive shift narrative, emerging theme hashtags, and weekly recommendations.<br>6. Switch to "Emotional & Cognitive Metrics" tab and click "Celebrate Milestone 🎉" to trigger confetti. | Activity matrix renders color-intensity tiles, Gemini synthesizes longitudinal cognitive trends, and milestone confetti fires. |
