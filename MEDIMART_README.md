# Medimart - Digital Health Assistant

A multilingual digital health assistant web application designed for students, elderly users, and people in remote/semi-urban areas.

## Features

### 1. User Profile System
- Collects essential health information (name, age, pregnancy status, allergies, medical conditions)
- Persistent storage with localStorage
- Personalized health guidance based on user profile

### 2. Multilingual Support
- Hindi and English language options
- Bilingual responses for Hindi users
- Language preference persists across sessions

### 3. Health Assistant Agent
- **Agent ID**: `6985a61fe2c0086a4fc43bf1`
- Conversational health guidance
- Pregnancy-aware recommendations
- Context-aware responses based on user profile
- Risk level assessment (LOW, MODERATE, HIGH)
- Safe home remedies suggestions
- Warning signs detection

### 4. Medicine Scanner Agent
- **Agent ID**: `6985a5fb5eb49186d63e5df4`
- Upload medicine images for analysis
- Extracts medicine information (name, uses, warnings)
- Pregnancy warnings highlighted
- Automatic health safety assessment

### 5. Knowledge Base
- **RAG ID**: `6985a5b6de7de278e55d2897`
- Contains medicine database with common medicines
- Pregnancy safety information
- Health tips in multiple languages

## User Flow

1. **Login Screen**: Enter profile information (name, age, pregnancy status, allergies, conditions)
2. **Language Selection**: Choose Hindi or English
3. **Dashboard**: Access health tips, quick actions, care & precautions
4. **Chat Interface**: Ask health questions and get personalized guidance
5. **Medicine Scanner**: Upload medicine images for safety analysis

## Design System

### Colors
- **Primary**: Mint Green (#98D8C8) - Trust and wellness
- **Warning**: Coral (#F7786B) - Alerts and pregnancy warnings
- **Background**: Cream (#FFF8F0) - Soft, calming

### Typography
- Base: 16pt
- Headings: 24pt
- Large touch targets: 48px minimum

### Components
- Rounded buttons and cards
- Pill-shaped badges
- Generous spacing (16-24px)
- High contrast for accessibility

## Technical Implementation

### Tech Stack
- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Hooks + localStorage
- **API Integration**: Lyzr AI Agent API

### Key Files
- `app/page.tsx` - Main application component
- `lib/aiAgent.ts` - AI agent integration utilities
- `app/api/agent/route.ts` - Backend API for agent calls
- `app/api/upload/route.ts` - File upload handling
- `workflow.json` - Agent workflow definition
- `test_responses/*.json` - Agent response schemas

### Agent Integration

```typescript
// Health Assistant
const result = await callAIAgent(contextMessage, HEALTH_ASSISTANT_AGENT_ID)

// Medicine Scanner with image
const uploadResult = await uploadFiles(imageFile)
const scanResult = await callAIAgent(message, MEDICINE_SCANNER_AGENT_ID, {
  assets: uploadResult.asset_ids
})
```

## Features Implemented

### Health Assistant
- ✅ Multilingual responses (Hindi/English)
- ✅ Pregnancy-aware guidance
- ✅ User profile context integration
- ✅ Risk level assessment
- ✅ Safe home remedies
- ✅ Warning signs detection
- ✅ Personalized recommendations

### Medicine Scanner
- ✅ Image upload and processing
- ✅ Medicine information extraction
- ✅ Pregnancy warnings
- ✅ Automatic health assessment
- ✅ Integration with Health Assistant

### UI/UX
- ✅ Login with profile collection
- ✅ Language selection
- ✅ Dashboard with health tips
- ✅ Chat interface with message history
- ✅ Medicine scanner with file upload
- ✅ Responsive design
- ✅ Typing indicators
- ✅ Quick reply suggestions
- ✅ Recent activity tracking
- ✅ Care & precautions sections

## Environment Setup

Required environment variable:
```
LYZR_API_KEY=your_api_key_here
```

## Usage

### Start Development Server
```bash
npm run dev
```

### Access the Application
Open http://localhost:3000

### Test the Health Assistant
1. Complete login with your profile
2. Select your preferred language
3. Navigate to "Ask Question" from dashboard
4. Type a health question or use quick replies
5. View personalized health guidance

### Test Medicine Scanner
1. Navigate to "Scan Medicine" from dashboard
2. Upload a medicine image
3. View extracted medicine information
4. Get personalized safety assessment
5. Results appear in chat interface

## Safety Features

- Never prescribes medicines or dosages
- Recommends doctor consultation for serious conditions
- Highlights pregnancy warnings prominently
- Provides risk level indicators
- Shows warning signs for immediate care
- Non-technical, calm language

## Response Structure

### Health Assistant Response
```json
{
  "message": "Conversational health guidance...",
  "risk_level": "MODERATE",
  "pregnancy_alert": true,
  "recommendation": "CONSULT_DOCTOR_URGENTLY",
  "language_used": "BILINGUAL_HINDI_ENGLISH",
  "safe_home_remedies": ["Remedy 1", "Remedy 2"],
  "warning_signs": ["Sign 1", "Sign 2"]
}
```

### Medicine Scanner Response
```json
{
  "medicine_name": "Paracetamol",
  "generic_name": "Acetaminophen",
  "category": "Analgesic, Antipyretic",
  "uses": ["Pain relief", "Fever reduction"],
  "pregnancy_warning": "Generally safe when used as directed",
  "side_effects": ["Rare: Nausea", "Overdose: Liver damage"],
  "contraindications": ["Severe liver disease"],
  "dosage_note": "Consult healthcare provider"
}
```

## Notes

- Chat history persists in localStorage
- User profile saved for future sessions
- Recent activity shows last 3 interactions
- Health tips rotate every 5 seconds
- Automatic welcome message in selected language

## Troubleshooting

### Agent not responding
- Check LYZR_API_KEY in .env.local
- Verify agent IDs are correct
- Check browser console for errors

### Medicine scan failing
- Ensure image is clear and well-lit
- Check file upload succeeded
- Verify API credits available

### Language not switching
- Clear localStorage and re-login
- Check language selection was saved
- Verify language preference in profile

---

Built with care for students, elderly users, and remote communities. 🏥
