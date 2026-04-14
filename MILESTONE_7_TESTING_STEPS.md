# Milestone 7: Security Testing Guide - Step by Step

## 🚀 Quick Start Setup

### Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies (already installed)
cd ../
npm install
```

### Step 2: Set Up Environment Variables

Create/update `.env` file in the root and `backend/.env`:

```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/nexus
JWT_SECRET=your_super_secret_key_here_minimum_32_characters_long
JWT_REFRESH_SECRET=your_refresh_token_secret_here_minimum_32_chars
JWT_EXPIRE=15m

# Email Configuration (for OTP)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=test@nexus.com
EMAIL_PASS=password
EMAIL_FROM=otp@nexus.com
EMAIL_SECURE=false

# Frontend
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Services

**Terminal 1 - Backend:**

```bash
cd backend
npm start
# Should see: "Server running on port 5000"
```

**Terminal 2 - Frontend:**

```bash
cd Nexus
npm run dev
# Should see: "Local: http://localhost:5173"
```

**Terminal 3 - Mailhog (for testing OTP emails):**

```bash
# Windows - download from: https://github.com/mailhog/MailHog/releases
# Or use Docker:
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Access email UI at: http://localhost:8025
```

---

## 🧪 Test Cases

### TEST 1: Password Validation on Registration

**Goal:** Verify password strength requirements

**Steps:**

1. Navigate to `http://localhost:5173/register`
2. Fill in:
   - **Name:** John Doe
   - **Email:** john@test.com
   - **Role:** Entrepreneur

3. **Test Weak Passwords (Should FAIL):**
   - Try `password` → Error: "must contain uppercase, lowercase, number, and special character"
   - Try `Pass123` → Error: "must be at least 8 characters"
   - Try `Pass@123` (8 chars, has all) → Should work ✓

4. **Test Strong Password (Should SUCCEED):**
   - `SecurePass@123` → Submit button enabled
   - Password strength shown
   - Form submits successfully

**Expected Result:**

- ✅ Weak passwords rejected with clear error
- ✅ Strong passwords accepted
- ✅ Real-time validation feedback

---

### TEST 2: Form Sanitization (XSS Prevention)

**Goal:** Verify HTML/script tags are stripped

**Steps:**

1. Go to `/register` page
2. In **Name field**, enter: `<script>alert('XSS')</script>John`
3. In **Email field**, enter: `test<img src=x>@example.com`
4. Use password: `SecurePass@123`
5. Submit form

6. After registration, check user profile
7. Verify sanitized data (no script tags visible)

**Expected Result:**

- ✅ Script tags removed from name
- ✅ Image tags removed from email
- ✅ Stored safely in database without HTML

---

### TEST 3: Login & 2FA OTP Flow

**Goal:** Test complete 2FA authentication

**Steps:**

#### 3.1 Initiate Login:

1. Go to `http://localhost:5173/login`
2. Select role: **Entrepreneur**
3. Fill in:
   - Email: `sarah@techwave.io`
   - Password: `SecurePass@123`
4. Click **"Sign in"**

**Expected Result:**

- ✅ You see message: "OTP sent to your email"
- ✅ Screen shows "Verify Your Identity"
- ✅ Email input field visible

#### 3.2 Get OTP Code:

1. Open Mailhog at `http://localhost:8025`
2. Look for email from `otp@nexus.com`
3. Subject: "🔐 Nexus 2FA OTP Code"
4. **Copy the 6-digit code** (e.g., 123456)

**Expected Result:**

- ✅ Email received within 2 seconds
- ✅ OTP code displayed in nice format
- ✅ Message says "Valid for 10 minutes"

#### 3.3 Verify OTP:

1. Go back to login screen
2. Paste OTP code into input field
3. Click **"Verify OTP"**

**Expected Result:**

- ✅ Loading state shown
- ✅ Success: Redirected to dashboard
- ✅ Logged in as Sarah
- ✅ Tokens stored in localStorage

#### 3.4 Test OTP Resend:

1. Go back to `/login`
2. Try same email/password again
3. Wait for OTP screen
4. Click **"Resend OTP"** button
5. Notice 60-second cooldown timer

**Expected Result:**

- ✅ New OTP sent
- ✅ Button shows "Resend in 45s"
- ✅ New code in Mailhog email

#### 3.5 Test OTP Attempt Limits:

1. Try login again
2. Get OTP but enter **wrong code**
3. Try again (wrong code)
4. Try again (wrong code)
5. On 4th attempt, should see error: "Maximum OTP attempts exceeded"

**Expected Result:**

- ✅ Each wrong attempt shows "Attempts remaining: X"
- ✅ After 3 failed attempts, locked out
- ✅ Must request new OTP

---

### TEST 4: Token Refresh & Expiration

**Goal:** Verify JWT token management

**Steps:**

#### 4.1 Check Token in Browser:

1. Login successfully
2. Open **DevTools** (F12)
3. Go to **Application → Local Storage**
4. Look for:
   - `business_nexus_access_token`: (should be long JWT)
   - `business_nexus_refresh_token`: (should be long JWT)
   - `business_nexus_user`: (should have user data)

**Expected Result:**

- ✅ Both tokens present
- ✅ Tokens are actual JWT format (three parts separated by dots)

#### 4.2 Test Token Expiration:

1. Copy your `access_token` from LocalStorage
2. Decode at `https://jwt.io` to see expiration
3. Should see: `"exp": <timestamp>` (15 minutes from login)

**Expected Result:**

- ✅ Access token expires in ~15 minutes
- ✅ Refresh token expires in ~7 days

#### 4.3 Test Automatic Refresh:

1. Note current access token
2. Wait or manually manipulate localStorage to expire access token
3. Try making any API call (e.g., go to Payments page)
4. Check localStorage again

**Expected Result:**

- ✅ New access token generated
- ✅ API call succeeds
- ✅ Old token replaced with fresh one

---

### TEST 5: Role-Based Authorization

**Goal:** Verify users can't access role-restricted resources

**Steps:**

#### 5.1 Test Profile Ownership:

1. Login as **Entrepreneur** (sarah@techwave.io)
2. Go to profile page
3. Copy current URL
4. Manually change user ID in URL to different user ID
5. Try to update that user's profile

**Expected Result:**

- ✅ Get error: "Access denied. You can only modify your own resources"
- ✅ Profile doesn't update
- ✅ Cannot edit other users' profiles

#### 5.2 Test Password Change Ownership:

1. Logged in as Sarah
2. Try to change **another user's** password via API:
   ```bash
   curl -X PUT http://localhost:5000/api/users/OTHER_USER_ID/change-password \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"password":"NewPass@123"}'
   ```

**Expected Result:**

- ✅ Returns 403 Forbidden
- ✅ Error: "Access denied. You can only modify your own resources"

#### 5.3 Test Protected Routes Without Token:

1. Try accessing API directly without token:
   ```bash
   curl http://localhost:5000/api/payments/wallet
   ```

**Expected Result:**

- ✅ Returns 401: "Not authorized - no token provided"

#### 5.4 Test Protected Routes With Invalid Token:

1. Try with fake token:
   ```bash
   curl -H "Authorization: Bearer INVALID_TOKEN" \
     http://localhost:5000/api/payments/wallet
   ```

**Expected Result:**

- ✅ Returns 401: "Not authorized - invalid token"

---

### TEST 6: Input Sanitization (NoSQL Injection Prevention)

**Goal:** Verify injection attacks are blocked

**Steps:**

#### 6.1 Test NoSQL Injection on Login:

1. Try login with injection payload:
   - Email: `{"$ne": null}`
   - Password: `{"$ne": null}`
   - Role: `entrepreneur`

**Expected Result:**

- ✅ Sanitized input converted to safe string
- ✅ Returns "Invalid credentials"
- ✅ Database not affected

#### 6.2 Test XSS in User Data:

1. Create/edit user profile with XSS payload in bio:
   - `<img src=x onerror="alert('XSS')">`

2. Save and view your profile

**Expected Result:**

- ✅ Alert doesn't execute
- ✅ Stored as plain text
- ✅ No script execution

---

### TEST 7: Demo Account Testing

**Goal:** Quick test with pre-seeded accounts

**Steps:**

1. Go to `/login`
2. Click **"Entrepreneur Demo"** button or **"Investor Demo"**
3. Credentials auto-fill:
   - Entrepreneur: `sarah@techwave.io` / `SecurePass@123`
   - Investor: `michael@vcinnovate.com` / `SecurePass@123`

4. Click **"Sign in"**
5. Get OTP from Mailhog
6. Enter OTP to complete login

**Expected Result:**

- ✅ Demo accounts work perfectly
- ✅ 2FA flow completes
- ✅ Dashboard loads

---

## ✅ Testing Checklist

### Password & Registration

- [ ] Weak passwords rejected
- [ ] Strong passwords accepted
- [ ] Password confirmation required
- [ ] Email validation works
- [ ] Role selection required

### 2FA OTP

- [ ] OTP generated on login
- [ ] Email sent immediately
- [ ] OTP displays 6 digits
- [ ] Correct OTP verifies successfully
- [ ] Wrong OTP shows error with attempts remaining
- [ ] 3 wrong attempts locks account
- [ ] Resend works with 60s cooldown
- [ ] Expired OTP (after 10 min) shows error

### JWT Tokens

- [ ] Access token created (15m expiration)
- [ ] Refresh token created (7d expiration)
- [ ] Tokens stored in localStorage
- [ ] Tokens visible in DevTools
- [ ] Automatic refresh before expiration

### Authorization

- [ ] Can edit own profile
- [ ] Cannot edit other profiles
- [ ] Can change own password
- [ ] Cannot change other passwords
- [ ] Protected routes require token
- [ ] Invalid tokens rejected

### Sanitization

- [ ] HTML tags stripped from inputs
- [ ] Script tags blocked
- [ ] NoSQL injection prevented
- [ ] No console errors
- [ ] Data stored safely

---

## 🐛 Troubleshooting

### Issue: OTP email not arriving

**Solution:**

- Check Mailhog at `http://localhost:8025`
- Verify EMAIL_HOST=localhost, EMAIL_PORT=1025
- Check backend logs for email sending errors
- Restart backend server

### Issue: Token errors on API calls

**Solution:**

- Clear localStorage: `localStorage.clear()`
- Log out and log back in
- Check token format in DevTools
- Verify JWT_SECRET matches in .env

### Issue: Password validation not working

**Solution:**

- Reload page (F5)
- Check browser console for errors
- Verify regex: `(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])`
- Try: `TestPass@123` (should work)

### Issue: 2FA screen stuck loading

**Solution:**

- Check backend logs
- Verify database connection
- Check OTP model exists in MongoDB
- Restart backend

---

## 🎬 Video Test Walkthrough (Manual Steps)

1. **3 min**: Register with strong password
2. **2 min**: Test weak password rejection
3. **5 min**: Login and complete 2FA
4. **2 min**: Check tokens in DevTools
5. **2 min**: Test profile ownership
6. **1 min**: Test sanitization
7. **Total**: ~15 minutes

---

## 📊 Final Verification Commands

```bash
# Test backend is running
curl http://localhost:5000/api/health
# Should return: {"status":"Server is running"}

# Test database connection
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"TestPass@123","confirmPassword":"TestPass@123","role":"entrepreneur"}'
# Should return user data with tokens

# Test 2FA endpoint
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"otpId":"invalid","code":"123456"}'
# Should return: {"message":"OTP expired or invalid"}
```

---

## 🚀 After Testing Passes

1. ✅ All test cases pass
2. ✅ No console errors
3. ✅ No backend errors
4. ✅ Deploy to staging
5. ✅ Run git push:

```bash
git status
git add .
git commit -m "Milestone 7 Security Testing - All Tests Passed"
git push
```

---

## 📝 Notes

- **OTP codes**: 6 random digits (0-999999)
- **OTP Expiration**: 10 minutes
- **OTP Attempts**: Max 3 wrong attempts
- **Resend Cooldown**: 60 seconds
- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- **Password Requirements**:
  - Min 8 characters
  - At least 1 uppercase (A-Z)
  - At least 1 lowercase (a-z)
  - At least 1 number (0-9)
  - At least 1 special char (@$!%\*?&)
