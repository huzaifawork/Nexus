# Agora Video Call Testing Guide

## Setup Complete ✅

Your Agora integration is now configured with:

- **App ID**: `228bc025f3d440b88b977f58ddc649f3`
- **Backend Token Generator**: `/api/video-call/token`
- **Frontend Integration**: Agora RTC SDK with authenticated token requests

---

## Testing Instructions

### Step 1: Start the Backend Server

```bash
cd C:\Users\GCA\Desktop\NexusProject\Nexus\backend
npm run dev
```

**Expected Output:**

```
Server running on port 5000
MongoDB Connected: ...
```

### Step 2: Start the Frontend Server

```bash
cd C:\Users\GCA\Desktop\NexusProject\Nexus
npm run dev
```

**Expected Output:**

```
VITE v5.4.8  ready in 460 ms
➜  Local:   http://localhost:5173/
```

### Step 3: Seed the Database (if not already done)

```bash
cd C:\Users\GCA\Desktop\NexusProject\Nexus\backend
npm run seed
```

---

## Test Scenario: Multi-User Video Call

### Test Case 1: Two Users in Same Call

**Setup:**

1. Open two browser windows/tabs
2. Window A: Login as `sarah@techwave.io` / `password123` (Entrepreneur)
3. Window B: Login as `michael@vcinnovate.com` / `password123` (Investor)

**Actions:**

1. Both users navigate to a meeting page that triggers the VideoCall component
2. Both click to join the call
3. Wait 5-10 seconds for connection

**Expected Results:**

- ✅ Both users see "Connecting to call..." loading screen
- ✅ Local video appears in Window A and Window B
- ✅ Participant count shows "2 in call"
- ✅ Remote user appears after ~3-5 seconds
- ✅ Audio/Video toggles work for each user
- ✅ Leave button ends the call for that user

### Test Case 2: Call with 3+ Participants

**Setup:**

1. Open 3+ browser windows with different users
2. Each logs in and navigates to the same meeting

**Expected Results:**

- ✅ All video feeds display in a grid (1 local + N remote)
- ✅ Participant count shows correctly (e.g., "4 in call")
- ✅ Audio/video works for all simultaneously
- ✅ When one user leaves, others remain connected

### Test Case 3: Media Controls

**Test Audio Toggle:**

1. One user disables microphone
2. Other users cannot hear them
3. Toggle back on
4. Audio is restored

**Test Video Toggle:**

1. One user disables camera
2. Shows placeholder in video area
3. Toggle back on
4. Video feed returns

---

## Backend Token Endpoint Details

**POST `/api/video-call/token`**

Request:

```json
{
  "meetingId": "meeting_12345"
}
```

Response:

```json
{
  "channelName": "meeting_meeting_12345",
  "appId": "228bc025f3d440b88b977f58ddc649f3",
  "token": "demo_token...",
  "uid": "user_id_123"
}
```

---

## Troubleshooting

### Issue: "Connecting to call..." never progresses

**Solution:**

- Check browser console for errors (F12 → Console tab)
- Ensure backend is running on port 5000
- Check that users are logged in (JWT token in localStorage)
- Verify Agora App ID is correct in backend `.env`

### Issue: No video feed appears

**Solution:**

- Check camera/microphone permissions in browser
- Ensure browser has camera access granted
- Try disabling/enabling video toggle
- Restart the browser

### Issue: Remote users don't appear

**Solution:**

- Wait 5-10 seconds for connection to establish
- Check network tab in DevTools for API errors
- Ensure both users are in the same meeting ID
- Check browser console for WebRTC errors

### Issue: "Failed to get token from backend"

**Solution:**

- Ensure backend is running
- Check that you're logged in (JWT token exists)
- Verify Authorization header includes Bearer token
- Check backend logs for errors

---

## Next Steps: Production Deployment

### When Ready for Production:

1. **Get Agora App Certificate**
   - Go to https://console.agora.io → Project Settings
   - Copy App Certificate
   - Add to backend `.env`: `AGORA_APP_CERTIFICATE=your_certificate_here`

2. **Install Token Builder Package**

   ```bash
   cd backend
   npm install agora-access-token
   ```

3. **Enable Secure Token Generation**
   - The backend controller will automatically use `RtcTokenBuilder` when certificate is available

4. **Set Environment Variables for Production**
   - Update `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`
   - Ensure `CLIENT_URL` matches your production domain

5. **Test Production Tokens**
   - Tokens will expire in 1 hour
   - The system will fail gracefully if tokens expire during a call

---

## Current Limitations (Development Mode)

- Using demo tokens (valid without certificate)
- No token expiration enforced
- For production, implement proper token refresh
- Certificate needed for production security

---

## Architecture Overview

```
Browser (Frontend)
  ↓
  VideoCall.tsx requests token
  ↓
Backend `/api/video-call/token`
  ↓ (generates Agora token with channelName, appId, uid)
  ↓
Returns token to frontend
  ↓
Agora RTC SDK joins channel with token
  ↓
Users can see each other's video/audio
  ↓
Agora's cloud handles peer discovery & WebRTC signaling
```

---

## Success Criteria

After testing, you should observe:

- ✅ Video calls establish within 5-10 seconds
- ✅ Multiple participants (2+) can be in same call
- ✅ Audio and video controls work
- ✅ Leaving ends call for that user only
- ✅ No console errors in browser DevTools
- ✅ Backend logs show successful token generation
