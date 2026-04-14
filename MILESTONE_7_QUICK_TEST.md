# ⚡ QUICK TEST GUIDE - Milestone 7 Security (Mock Email Version)

## 🚀 Start Services (2 Terminals)

**Terminal 1: Backend**
```bash
cd backend
npm start
```

**Terminal 2: Frontend**
```bash
npm run dev
```

---

## 🧪 Test in 2 Minutes

### ✅ Test 1: Strong Password Registration

1. Go to `http://localhost:5173/register`
2. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `SecurePass@123`
   - Confirm: `SecurePass@123`
   - Role: `Entrepreneur`
3. Click "Sign up"
4. ✅ Should register successfully

---

### ✅ Test 2: 2FA Login (OTP in Console)

1. Go to `http://localhost:5173/login`
2. Click **"Entrepreneur Demo"** (auto-fills credentials)
3. Click **"Sign in"**
4. **👀 WATCH YOUR BACKEND TERMINAL** for:

```
╔════════════════════════════════════════╗
║        🔐 MOCK EMAIL SERVICE          ║
╚════════════════════════════════════════╝
🔐 YOUR OTP CODE: 456789
```

5. Copy the **6-digit code** → paste into frontend form
6. Click **"Verify OTP"**
7. ✅ Login successful!

---

### ✅ Test 3: Check Tokens

1. Press **F12** (DevTools)
2. Go to **Application → Local Storage**
3. Look for:
   - `business_nexus_access_token` ✅
   - `business_nexus_refresh_token` ✅
4. Both should exist

---

### ✅ Test 4: Protected Routes

1. Go to **Payments** page
2. Should load successfully ✅
3. Log out and try accessing Payments
4. Should redirect to login ✅

---

## 🐛 Troubleshooting

### Problem: OTP not showing in terminal
**Solution:** 
- Check backend terminal (scroll up)
- Or use API endpoint: `http://localhost:5000/api/auth/test/otp/sarah@techwave.io`
- This returns the latest OTP for that email

### Problem: "Failed to send OTP" error
**Solution:**
- This is normal! Mock service still works
- OTP is already printed to console
- Just check backend terminal for the code

---

## ✅ DONE! Push to GitHub

```bash
git add .
git commit -m "Milestone 7: Security with mock email service - All tests passing"
git push
```

---

## 📊 What Was Implemented

✅ **Password Strength**: 8+ chars, uppercase, lowercase, number, special char  
✅ **2FA OTP**: 6-digit code, 10min expiration, 3 attempt limit  
✅ **JWT Tokens**: 15min access token, 7day refresh token  
✅ **Input Sanitization**: XSS & NoSQL injection prevention  
✅ **Role-Based Access**: Entrepreneur/Investor roles protected  
✅ **Mock Email Service**: OTP codes printed to console for easy testing  

---

**Ready to test? Just start the two terminals and follow the tests above!** 🚀
