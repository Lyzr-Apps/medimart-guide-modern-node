# Medimart Testing Guide

## Quick Test Checklist

### 1. Login Flow
- [ ] Open application at http://localhost:3000
- [ ] Enter name (e.g., "Priya Sharma")
- [ ] Enter age (e.g., "28")
- [ ] Select pregnancy status (Yes/No)
- [ ] Add allergies (optional, e.g., "Penicillin")
- [ ] Add medical conditions (optional, e.g., "Diabetes")
- [ ] Click "Continue" button
- [ ] Verify navigation to language selection

### 2. Language Selection
- [ ] See two large cards: "हिंदी" and "English"
- [ ] Click on preferred language
- [ ] Verify navigation to dashboard
- [ ] Language preference should persist after refresh

### 3. Dashboard Features
- [ ] User greeting shows correct name
- [ ] Health tip card displays and rotates (every 5 seconds)
- [ ] Two quick action buttons visible: "Scan Medicine" and "Ask Question"
- [ ] Care & Precautions section shows relevant content
- [ ] If pregnant, pregnancy care section is visible
- [ ] Language toggle (globe icon) available

### 4. Health Assistant Chat

#### Test Case 1: Simple Health Question
**Input**: "I have a headache. What should I do?"

**Expected Response**:
- Message in selected language (bilingual if Hindi)
- Practical advice about headache relief
- Risk level indicator (likely LOW or MODERATE)
- Safe home remedies suggestions
- When to consult a doctor

**Verify**:
- [ ] Response appears in chat bubble (mint green background)
- [ ] Typing indicator shows while loading
- [ ] Response is personalized with user context
- [ ] Recent activity updated

#### Test Case 2: Pregnancy-Related Question (if pregnant user)
**Input**: "I have morning sickness. What can I do?"

**Expected Response**:
- Pregnancy-specific advice
- Pregnancy alert badge (coral border) appears
- Safe remedies for pregnant women
- Warning signs to watch for
- Risk level assessment

**Verify**:
- [ ] Pregnancy alert displayed prominently
- [ ] Coral-colored warning badge visible
- [ ] Advice is pregnancy-safe
- [ ] Recommendation appropriate for pregnancy

#### Test Case 3: Medicine Safety Question
**Input**: "Is Paracetamol safe for me?"

**Expected Response**:
- Information about Paracetamol
- Safety assessment based on user profile
- Dosage considerations
- Pregnancy warnings (if applicable)
- When to avoid

**Verify**:
- [ ] Personalized safety assessment
- [ ] References user's age/pregnancy status
- [ ] Clear recommendation (safe/consult doctor)
- [ ] Risk level indicated

### 5. Medicine Scanner

#### Test Preparation
- Prepare a medicine image (or use a sample image)
- Image should show medicine name clearly

#### Test Case: Scan Medicine
**Steps**:
1. Click "Scan Medicine" from dashboard
2. Click upload area
3. Select medicine image
4. Click "Scan Medicine" button
5. Wait for processing

**Expected Response**:
- Upload success
- Medicine information extracted:
  - Medicine name (e.g., "Paracetamol")
  - Generic name
  - Category badge
  - Uses list
  - Pregnancy warning (if applicable)
  - Side effects
  - Contraindications
- Automatic health assessment
- Navigation to chat with results

**Verify**:
- [ ] File upload successful
- [ ] Medicine Scanner agent extracts data
- [ ] Scan results display on scanner page
- [ ] Health Assistant provides safety assessment
- [ ] Results appear in chat interface
- [ ] Recent activity shows scan entry
- [ ] Pregnancy warnings highlighted (if applicable)

### 6. Quick Replies

**Verify**:
- [ ] Quick reply chips appear when chat is empty
- [ ] Different questions for pregnant vs non-pregnant users
- [ ] Clicking quick reply populates input field
- [ ] Can send quick reply question

### 7. Persistence & Navigation

**Test localStorage**:
1. Complete login and chat with assistant
2. Refresh page (F5)
3. Verify:
   - [ ] User returns to dashboard (not login)
   - [ ] Chat history preserved
   - [ ] User profile intact
   - [ ] Language preference saved
   - [ ] Recent activity persists

**Test Navigation**:
- [ ] Can navigate between all screens (Dashboard, Chat, Scan)
- [ ] Back arrow returns to dashboard from chat/scan
- [ ] Language toggle opens language selection
- [ ] Globe icon in header works

### 8. UI/UX Validation

**Design System**:
- [ ] Mint green (#98D8C8) used for primary actions
- [ ] Coral (#F7786B) used for warnings
- [ ] Cream (#FFF8F0) backgrounds
- [ ] NO blue, navy, or purple colors
- [ ] Touch targets minimum 48px height
- [ ] Generous padding (16-24px)
- [ ] Rounded corners on cards and buttons

**Responsiveness**:
- [ ] Works on mobile viewport (375px)
- [ ] Works on tablet viewport (768px)
- [ ] Works on desktop (1440px)
- [ ] Text is readable at all sizes
- [ ] Buttons are tappable on mobile

### 9. Error Handling

**Test Error Cases**:
1. Empty chat input → Send button disabled
2. No file selected in scanner → Scan button disabled
3. Network error → Error message displayed
4. Agent timeout → Graceful error handling

**Verify**:
- [ ] No console errors in browser
- [ ] Error messages are user-friendly
- [ ] Loading states clear
- [ ] No crashes or white screens

### 10. Agent Response Validation

**Check Console Logs**:
- Open browser DevTools → Console
- Send a health question
- Look for:
  - "Health Assistant Response:" log
  - Response structure matches expected format
  - No 400/500 errors

**Health Assistant Response Structure**:
```json
{
  "success": true,
  "response": {
    "status": "success",
    "result": {
      "message": "...",
      "risk_level": "LOW|MODERATE|HIGH",
      "pregnancy_alert": true/false,
      "recommendation": "...",
      "safe_home_remedies": [...],
      "warning_signs": [...]
    }
  }
}
```

**Medicine Scanner Response Structure**:
```json
{
  "success": true,
  "response": {
    "result": {
      "medicine_name": "...",
      "generic_name": "...",
      "category": "...",
      "uses": [...],
      "pregnancy_warning": "...",
      "side_effects": [...],
      "contraindications": [...]
    }
  }
}
```

## Common Issues & Solutions

### Issue: Chat not responding
**Solution**:
- Check browser console for errors
- Verify LYZR_API_KEY in .env.local
- Check network tab for API calls
- Verify agent IDs are correct

### Issue: Medicine scan failing
**Solution**:
- Use a clear image with visible text
- Check file size (< 5MB recommended)
- Verify upload succeeded before scanning
- Check API credits not exhausted

### Issue: Language not switching
**Solution**:
- Clear localStorage: `localStorage.clear()`
- Re-login and select language
- Check browser console for errors

### Issue: Pregnancy alerts not showing
**Solution**:
- Verify user profile has isPregnant: "yes"
- Check agent response includes pregnancy_alert: true
- Inspect message.data object in console

## Performance Benchmarks

- [ ] Login flow completes in < 1 second
- [ ] Language selection instant
- [ ] Dashboard loads in < 500ms
- [ ] Chat response in < 5 seconds (depends on agent)
- [ ] Medicine scan in < 10 seconds (depends on upload + agents)
- [ ] No visible lag when typing
- [ ] Smooth scrolling in chat

## Accessibility Checklist

- [ ] All buttons have clear labels
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets large enough (48px+)
- [ ] Text is readable (16pt base)
- [ ] Form fields have labels
- [ ] Error messages are clear
- [ ] Loading states indicated

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Test Scenarios

### Scenario 1: Pregnant User Journey
1. Login as pregnant user (age 25-35)
2. Select Hindi language
3. Ask: "I have a headache. What should I do?"
4. Verify pregnancy-specific guidance
5. Scan medicine (if available)
6. Check pregnancy warnings highlighted

### Scenario 2: Elderly User Journey
1. Login as elderly user (age 65+)
2. Select Hindi or English
3. Ask: "I have high blood pressure. What foods should I avoid?"
4. Verify clear, simple language
5. Check for appropriate recommendations

### Scenario 3: Student User Journey
1. Login as student (age 18-25)
2. Select English
3. Ask quick health questions
4. Test medicine scanner
5. Verify quick, practical advice

## Sign-off

- [ ] All test cases pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] UI matches design system
- [ ] Agents responding correctly
- [ ] Ready for user testing

**Tester Name**: _________________
**Date**: _________________
**Notes**: _________________
