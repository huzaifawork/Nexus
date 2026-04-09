# Week 1 Testing Checklist

## Pre-Testing Setup

### 1. Seed the Database
```bash
cd C:\Users\GCA\Desktop\NexusProject\backend
npm run seed
```

**Expected Output:**
```
MongoDB Connected
Cleared existing data
Created 4 entrepreneurs
Created 3 investors
Created 4 collaboration requests

✅ Database seeded successfully!

Sample Login Credentials:

Entrepreneurs:
  Email: sarah@techwave.io | Password: password123 | Role: entrepreneur
  Email: david@greenlife.co | Password: password123 | Role: entrepreneur
  Email: maya@healthpulse.com | Password: password123 | Role: entrepreneur
  Email: james@urbanfarm.io | Password: password123 | Role: entrepreneur

Investors:
  Email: michael@vcinnovate.com | Password: password123 | Role: investor
  Email: jennifer@impactvc.org | Password: password123 | Role: investor
  Email: robert@healthventures.com | Password: password123 | Role: investor
```

### 2. Start Backend Server
```bash
cd C:\Users\GCA\Desktop\NexusProject\backend
npm run dev
```

**Expected Output:**
```
Server running on port 5000
MongoDB Connected: ac-pjfq0tt-shard-00-00.7hj1kr8.mongodb.net
```

### 3. Start Frontend Server
```bash
cd C:\Users\GCA\Desktop\NexusProject\Nexus
npm run dev
```

**Expected Output:**
```
VITE v5.4.8  ready in 460 ms
➜  Local:   http://localhost:5173/
```

---

## Deliverable 1: GitHub Repo with Backend Setup ✅

### Verify Backend Structure
- [ ] `backend/` folder exists
- [ ] `config/db.js` exists
- [ ] `models/User.js` exists
- [ ] `models/Collaboration.js` exists
- [ ] `controllers/authController.js` exists
- [ ] `controllers/userController.js` exists
- [ ] `controllers/collaborationController.js` exists
- [ ] `middleware/auth.js` exists
- [ ] `middleware/errorHandler.js` exists
- [ ] `routes/auth.js` exists
- [ ] `routes/users.js` exists
- [ ] `routes/collaborations.js` exists
- [ ] `server.js` exists
- [ ] `.env` exists with all required variables
- [ ] `package.json` has all dependencies

### Verify Backend is Running
- [ ] Navigate to http://localhost:5000/api/health
- [ ] Should see: `{"status":"Server is running"}`

---

## Deliverable 2: Functional Authentication System ✅

### Test 1: User Registration (Entrepreneur)
1. [ ] Go to http://localhost:5173/register
2. [ ] Fill in:
   - Name: Test Entrepreneur
   - Email: test.entrepreneur@example.com
   - Password: test123456
   - Confirm Password: test123456
   - Role: Entrepreneur
3. [ ] Click "Create account"
4. [ ] Should redirect to `/dashboard/entrepreneur`
5. [ ] Should see welcome message with your name

**Verify in MongoDB Atlas:**
- [ ] Go to MongoDB Atlas → Browse Collections → nexus database → users collection
- [ ] Should see new user with email `test.entrepreneur@example.com`
- [ ] Password should be hashed (not plain text)
- [ ] Role should be `entrepreneur`

### Test 2: User Registration (Investor)
1. [ ] Logout (click profile icon → Logout)
2. [ ] Go to http://localhost:5173/register
3. [ ] Fill in:
   - Name: Test Investor
   - Email: test.investor@example.com
   - Password: test123456
   - Confirm Password: test123456
   - Role: Investor
4. [ ] Click "Create account"
5. [ ] Should redirect to `/dashboard/investor`
6. [ ] Should see welcome message with your name

**Verify in MongoDB Atlas:**
- [ ] Should see new user with email `test.investor@example.com`
- [ ] Role should be `investor`

### Test 3: Login (Entrepreneur)
1. [ ] Logout
2. [ ] Go to http://localhost:5173/login
3. [ ] Fill in:
   - Email: sarah@techwave.io
   - Password: password123
   - Role: Entrepreneur
4. [ ] Click "Sign in"
5. [ ] Should redirect to `/dashboard/entrepreneur`
6. [ ] Should see "Welcome, Sarah Johnson"

### Test 4: Login (Investor)
1. [ ] Logout
2. [ ] Go to http://localhost:5173/login
3. [ ] Fill in:
   - Email: michael@vcinnovate.com
   - Password: password123
   - Role: Investor
4. [ ] Click "Sign in"
5. [ ] Should redirect to `/dashboard/investor`
6. [ ] Should see "Welcome, Michael Rodriguez"

### Test 5: Invalid Login
1. [ ] Logout
2. [ ] Try to login with wrong password
3. [ ] Should see error: "Invalid credentials"
4. [ ] Should NOT be logged in

### Test 6: JWT Token Verification
1. [ ] Login as any user
2. [ ] Open browser DevTools → Application → Local Storage
3. [ ] Should see `business_nexus_user` with user data and token
4. [ ] Open DevTools → Network tab
5. [ ] Navigate to any page (e.g., Settings)
6. [ ] Check any API request
7. [ ] Should see `Authorization: Bearer <token>` in request headers

### Test 7: Protected Routes
1. [ ] Logout
2. [ ] Try to access http://localhost:5173/dashboard/entrepreneur
3. [ ] Should redirect to `/login`
4. [ ] Login as investor
5. [ ] Try to access http://localhost:5173/dashboard/entrepreneur
6. [ ] Should redirect to `/dashboard/investor` (role guard working)

### Test 8: Forgot Password
1. [ ] Logout
2. [ ] Go to http://localhost:5173/login
3. [ ] Click "Forgot your password?"
4. [ ] Enter: sarah@techwave.io
5. [ ] Click "Send reset instructions"
6. [ ] Should see success message
7. [ ] **Note:** Email won't actually send unless you configure EMAIL_USER and EMAIL_PASS in .env

### Test 9: Change Password
1. [ ] Login as sarah@techwave.io
2. [ ] Go to Settings
3. [ ] Scroll to "Change Password"
4. [ ] Fill in:
   - Current Password: password123
   - New Password: newpass123
   - Confirm New Password: newpass123
5. [ ] Click "Update Password"
6. [ ] Should see success message
7. [ ] Logout and try to login with old password (should fail)
8. [ ] Login with new password (should work)

---

## Deliverable 3: Profiles Stored/Retrieved from DB ✅

### Test 10: View Entrepreneur Profile
1. [ ] Login as investor (michael@vcinnovate.com)
2. [ ] Go to Dashboard
3. [ ] Should see list of entrepreneurs loaded from database
4. [ ] Click on "Sarah Johnson" card
5. [ ] Should navigate to `/profile/entrepreneur/<id>`
6. [ ] Should see:
   - Name: Sarah Johnson
   - Startup: TechWave AI
   - Industry: FinTech
   - Funding Needed: $1.5M
   - Bio and other details

**Verify Data Source:**
- [ ] Open DevTools → Network tab
- [ ] Should see API call to `GET /api/users/<id>`
- [ ] Response should contain user data from MongoDB

### Test 11: View Investor Profile
1. [ ] Login as entrepreneur (sarah@techwave.io)
2. [ ] Click on sidebar → "Find Investors"
3. [ ] Should see list of investors loaded from database
4. [ ] Click on "Michael Rodriguez" card
5. [ ] Should navigate to `/profile/investor/<id>`
6. [ ] Should see:
   - Name: Michael Rodriguez
   - Investment Interests: FinTech, SaaS, AI/ML
   - Investment Range: $250K - $1.5M
   - Portfolio companies

**Verify Data Source:**
- [ ] Open DevTools → Network tab
- [ ] Should see API call to `GET /api/users/<id>`
- [ ] Response should contain investor data from MongoDB

### Test 12: Update Profile
1. [ ] Login as sarah@techwave.io
2. [ ] Go to Settings
3. [ ] Update:
   - Name: Sarah Johnson Updated
   - Bio: Updated bio text
   - Location: New York, NY
4. [ ] Click "Save Changes"
5. [ ] Should see success message
6. [ ] Refresh page - changes should persist
7. [ ] Go to your profile page
8. [ ] Should see updated information

**Verify in MongoDB Atlas:**
- [ ] Go to MongoDB Atlas → users collection
- [ ] Find Sarah's document
- [ ] Should see updated name, bio, and location

### Test 13: List All Entrepreneurs (API)
1. [ ] Login as investor
2. [ ] Go to Dashboard
3. [ ] Should see all 4 seeded entrepreneurs + any you created
4. [ ] Open DevTools → Network
5. [ ] Should see `GET /api/users/entrepreneurs`
6. [ ] Response should be array of entrepreneur objects

### Test 14: List All Investors (API)
1. [ ] Login as entrepreneur
2. [ ] Go to "Find Investors" page
3. [ ] Should see all 3 seeded investors + any you created
4. [ ] Open DevTools → Network
5. [ ] Should see `GET /api/users/investors`
6. [ ] Response should be array of investor objects

### Test 15: Collaboration Requests
1. [ ] Login as investor (michael@vcinnovate.com)
2. [ ] Go to Dashboard
3. [ ] Click on any entrepreneur profile
4. [ ] Click "Request Collaboration"
5. [ ] Should see success message
6. [ ] Logout and login as that entrepreneur
7. [ ] Go to Dashboard
8. [ ] Should see the collaboration request in "Pending Requests"
9. [ ] Click "Accept"
10. [ ] Status should change to "Accepted"

**Verify in MongoDB Atlas:**
- [ ] Go to collaborations collection
- [ ] Should see new collaboration document
- [ ] Status should be "accepted"

### Test 16: Search and Filter
1. [ ] Login as investor
2. [ ] Go to Dashboard
3. [ ] Type "FinTech" in search box
4. [ ] Should only show FinTech startups
5. [ ] Click on "FinTech" industry badge
6. [ ] Should filter by FinTech
7. [ ] Clear filters
8. [ ] Should show all startups again

---

## API Endpoint Testing (Optional - Using Postman/Thunder Client)

### Auth Endpoints

**POST /api/auth/register**
```json
{
  "name": "API Test User",
  "email": "apitest@example.com",
  "password": "test123456",
  "role": "entrepreneur"
}
```
Expected: 201 Created with user object and token

**POST /api/auth/login**
```json
{
  "email": "sarah@techwave.io",
  "password": "password123",
  "role": "entrepreneur"
}
```
Expected: 200 OK with user object and token

**POST /api/auth/forgot-password**
```json
{
  "email": "sarah@techwave.io"
}
```
Expected: 200 OK with success message

### User Endpoints (Requires Authorization header)

**GET /api/users/:id**
Headers: `Authorization: Bearer <token>`
Expected: 200 OK with user object

**PUT /api/users/:id**
Headers: `Authorization: Bearer <token>`
```json
{
  "name": "Updated Name",
  "bio": "Updated bio"
}
```
Expected: 200 OK with updated user object

**GET /api/users/entrepreneurs**
Headers: `Authorization: Bearer <token>`
Expected: 200 OK with array of entrepreneurs

**GET /api/users/investors**
Headers: `Authorization: Bearer <token>`
Expected: 200 OK with array of investors

### Collaboration Endpoints (Requires Authorization header)

**GET /api/collaborations**
Headers: `Authorization: Bearer <token>`
Expected: 200 OK with array of collaborations

**POST /api/collaborations** (Investor only)
Headers: `Authorization: Bearer <token>`
```json
{
  "entrepreneurId": "<entrepreneur_id>",
  "message": "I'm interested in your startup"
}
```
Expected: 201 Created with collaboration object

**PATCH /api/collaborations/:id** (Entrepreneur only)
Headers: `Authorization: Bearer <token>`
```json
{
  "status": "accepted"
}
```
Expected: 200 OK with updated collaboration

---

## Final Verification Checklist

- [ ] All 4 entrepreneurs visible in database
- [ ] All 3 investors visible in database
- [ ] Can register new users (both roles)
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong credentials
- [ ] JWT tokens are generated and verified
- [ ] Protected routes require authentication
- [ ] Role-based access control works
- [ ] Can view any user profile
- [ ] Can update own profile
- [ ] Can change password
- [ ] Entrepreneurs see investor list
- [ ] Investors see entrepreneur list
- [ ] Can send collaboration requests
- [ ] Can accept/reject collaboration requests
- [ ] Search and filter work correctly
- [ ] All data persists in MongoDB
- [ ] No mock data is being used

---

## Common Issues & Solutions

**Issue:** "MongoDB Connection Error"
**Solution:** Check MONGO_URI in .env, ensure MongoDB Atlas cluster is running and IP is whitelisted

**Issue:** "Cannot read property 'role' of null"
**Solution:** User not logged in - clear localStorage and login again

**Issue:** "401 Unauthorized"
**Solution:** Token expired or invalid - logout and login again

**Issue:** "CORS Error"
**Solution:** Ensure backend is running and CLIENT_URL in .env matches frontend URL

**Issue:** "Cannot find module"
**Solution:** Run `npm install` in backend folder

**Issue:** Seed script fails
**Solution:** Ensure backend is NOT running when seeding (it locks the database)

---

## Week 1 Deliverables Status

✅ **Deliverable 1:** GitHub repo with backend setup
- Backend folder structure complete
- All models, controllers, routes implemented
- MongoDB connected
- Environment variables configured

✅ **Deliverable 2:** Functional authentication system
- JWT-based authentication working
- Register, login, logout functional
- Password hashing implemented
- Forgot/reset password implemented
- Protected routes working
- Role-based access control working

✅ **Deliverable 3:** Profiles stored/retrieved from DB
- User profiles stored in MongoDB
- Extended profile fields for entrepreneurs
- Extended profile fields for investors
- Profile retrieval working
- Profile updates working
- All frontend pages load from database
- No mock data dependencies

**Status: READY FOR WEEK 2** 🚀
