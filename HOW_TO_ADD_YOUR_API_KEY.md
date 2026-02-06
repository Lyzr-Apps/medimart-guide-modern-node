# How to Add Your Lyzr API Key

## Quick Guide

### Step 1: Get Your Lyzr API Key

1. Go to [Lyzr Studio](https://studio.lyzr.ai)
2. Log in to your account
3. Navigate to **Settings** or **API Keys**
4. Copy your API key (it should start with `sk-`)

### Step 2: Update the Environment File

Open the file `.env.local` in the project root and replace `YOUR_API_KEY_HERE` with your actual API key:

```bash
# .env.local
LYZR_API_KEY=sk-your-actual-api-key-here
VITE_LYZR_API_KEY=sk-your-actual-api-key-here
```

**Example:**
```bash
LYZR_API_KEY=sk-prod-abc123xyz456
VITE_LYZR_API_KEY=sk-prod-abc123xyz456
```

### Step 3: Restart the Development Server

After updating the API key, you need to restart the server:

```bash
# Stop the current server (Ctrl+C if running in terminal)
# Then restart:
npm run dev
```

Or if using a specific port:
```bash
npm run dev -- -p 3333
```

### Step 4: Verify It's Working

1. Open http://localhost:3333 (or your port)
2. Complete the login flow
3. Select a language
4. Try asking the Health Assistant a question
5. Check the browser console (F12) for any API errors

---

## Manual Method (Direct File Edit)

If you prefer to edit manually:

**File Location:** `/app/nextjs-project/.env.local`

**Edit this line:**
```bash
LYZR_API_KEY=YOUR_API_KEY_HERE
```

**To:**
```bash
LYZR_API_KEY=sk-your-actual-key
```

---

## Command Line Method

You can also update the API key using the command line:

```bash
# Navigate to project directory
cd /app/nextjs-project

# Update .env.local with your API key
echo "LYZR_API_KEY=sk-your-actual-key-here" > .env.local
echo "VITE_LYZR_API_KEY=sk-your-actual-key-here" >> .env.local

# Restart the server
npm run dev
```

---

## Using a Different API Provider

If you want to use a different API provider (not Lyzr), you'll need to:

### 1. Update the API Route

Edit `app/api/agent/route.ts`:

```typescript
// Change this line:
const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'

// To your API endpoint:
const YOUR_API_URL = 'https://your-api-provider.com/endpoint'
```

### 2. Update Environment Variable Names

In `.env.local`:
```bash
YOUR_PROVIDER_API_KEY=your-key-here
```

In `app/api/agent/route.ts`:
```typescript
const API_KEY = process.env.YOUR_PROVIDER_API_KEY || ''
```

### 3. Adjust Request Format

Modify the payload structure in `app/api/agent/route.ts` to match your API's requirements.

---

## Troubleshooting

### Error: "LYZR_API_KEY not configured"

**Solution:** Make sure `.env.local` exists and contains your API key. Restart the server.

### Error: "401 Unauthorized"

**Solution:** Your API key is invalid or expired. Get a new one from Lyzr Studio.

### Error: "429 Too Many Requests / Credits Exhausted"

**Solution:** Your API account has run out of credits. Add more credits to your Lyzr account.

### Changes Not Taking Effect

**Solution:**
1. Stop the server completely (Ctrl+C)
2. Clear Next.js cache: `rm -rf .next`
3. Restart: `npm run dev`

### API Key Shows as "undefined" in Console

**Solution:**
1. Check `.env.local` file exists in the project root
2. Ensure variable name is exactly `LYZR_API_KEY` (case-sensitive)
3. No spaces around the `=` sign
4. Restart the server after changes

---

## Security Best Practices

1. **Never commit .env.local to Git**
   - Already included in `.gitignore`
   - Keep your API keys private

2. **Use Server-Side Only**
   - API key is only used in `/app/api/` routes (server-side)
   - Never exposed to client/browser

3. **Rotate Keys Regularly**
   - Change your API key periodically
   - Revoke old keys from Lyzr Studio

4. **Use Different Keys for Development/Production**
   - Development: `.env.local`
   - Production: Set via hosting platform (Vercel, etc.)

---

## Current Agent IDs (Do Not Change)

These agent IDs are already configured in the application:

```typescript
// Health Assistant
const HEALTH_ASSISTANT_AGENT_ID = '6985a61fe2c0086a4fc43bf1'

// Medicine Scanner
const MEDICINE_SCANNER_AGENT_ID = '6985a5fb5eb49186d63e5df4'

// Knowledge Base RAG ID
const RAG_ID = '6985a5b6de7de278e55d2897'
```

**Note:** These IDs are tied to your Lyzr account. If you create new agents, update these IDs in `app/page.tsx`.

---

## Quick Test After Adding API Key

Run this test to verify your API key works:

```bash
# Test the Health Assistant
curl -X POST http://localhost:3333/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I have a headache",
    "agent_id": "6985a61fe2c0086a4fc43bf1"
  }'
```

**Expected Response:** JSON with health guidance

**Error Response:** Check the error message and update your API key accordingly.

---

## Need Help?

- **Lyzr Documentation:** https://docs.lyzr.ai
- **API Issues:** Check browser console (F12) for detailed errors
- **Agent Configuration:** See `MEDIMART_README.md` for full details

---

**Current Status:** API key placeholder set to `YOUR_API_KEY_HERE`
**Action Required:** Replace with your actual Lyzr API key and restart the server
