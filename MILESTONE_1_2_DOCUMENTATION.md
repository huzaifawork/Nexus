# Nexus Platform - Milestone 1 & 2 Documentation

## Milestone 1: Environment Setup & Codebase Familiarization ✅

### 1. Fork and Clone the Nexus Repo
- ✅ Repository cloned from: https://github.com/huzaifawork/Nexus.git
- ✅ Location: `C:\Users\GCA\Desktop\NexusProject\Nexus`

### 2. Backend Environment Setup (Node.js + Express + MongoDB)

**Backend Structure:**
```
backend/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── userController.js        # User/profile management
│   └── collaborationController.js # Collaboration requests
├── middleware/
│   ├── auth.js                  # JWT verification + role guard
│   └── errorHandler.js          # Global error handling
├── models/
│   ├── User.js                  # User schema (entrepreneurs + investors)
│   └── Collaboration.js         # Collaboration request schema
├── routes/
│   ├── auth.js                  # Auth endpoints
│   ├── users.js                 # User endpoints
│   └── collaborations.js        # Collaboration endpoints
├── .env                         # Environment variables
├── .gitignore
├── package.json
└── server.js                    # Express app entry point
```

**Dependencies Installed:**
- express - Web framework
- mongoose - MongoDB ODM
- dotenv - Environment variables
- cors - Cross-origin resource sharing
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- express-validator - Input validation
- nodemailer - Email sending (password reset)
- nodemon (dev) - Auto-restart server

**Environment Variables (.env):**
```
PORT=5000
MONGO_URI=mongodb+srv://mhuzaifatariq7_db_user:i8qXeAoA9tPSaDPy@cluster0.7hj1kr8.mongodb.net/nexus
JWT_SECRET=nexus_jwt_super_secret_key_change_in_production
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<your_email@gmail.com>
EMAIL_PASS=<your_email_app_password>
CLIENT_URL=http://localhost:5173
```

### 3. Frontend Connected to Backend

**Frontend Configuration:**
- ✅ `.env` file created with `VITE_API_URL=http://localhost:5000/api`
- ✅ Axios instance created at `src/lib/api.ts` with automatic JWT token attachment
- ✅ AuthContext updated to use real API calls instead of mock data

### 4. Frontend Features Documented & APIs Built

| Feature | Frontend Page | Backend API | Status |
|---------|--------------|-------------|--------|
| User Registration | RegisterPage.tsx | POST /api/auth/register | ✅ |
| User Login | LoginPage.tsx | POST /api/auth/login | ✅ |
| Forgot Password | ForgotPasswordPage.tsx | POST /api/auth/forgot-password | ✅ |
| Reset Password | ResetPasswordPage.tsx | POST /api/auth/reset-password/:token | ✅ |
| View Profile | EntrepreneurProfile.tsx, InvestorProfile.tsx | GET /api/users/:id | ✅ |
| Update Profile | SettingsPage.tsx | PUT /api/users/:id | ✅ |
| Change Password | SettingsPage.tsx | PUT /api/users/:id/change-password | ✅ |
| List Entrepreneurs | EntrepreneursPage.tsx, InvestorDashboard.tsx | GET /api/users/entrepreneurs | ✅ |
| List Investors | InvestorsPage.tsx, EntrepreneurDashboard.tsx | GET /api/users/investors | ✅ |
| Send Collaboration Request | EntrepreneurProfile.tsx | POST /api/collaborations | ✅ |
| Get Collaboration Requests | EntrepreneurDashboard.tsx | GET /api/collaborations | ✅ |
| Accept/Reject Request | CollaborationRequestCard.tsx | PATCH /api/collaborations/:id | ✅ |

---

## Milestone 2: User Authentication & Profiles ✅

### 1. Secure Authentication (JWT-based)

**Implementation:**
- ✅ JWT tokens generated on login/register using `jsonwebtoken`
- ✅ Tokens stored in localStorage on frontend
- ✅ Axios interceptor automatically attaches `Authorization: Bearer <token>` to every request
- ✅ Backend middleware `protect` verifies JWT on protected routes
- ✅ Token expiry set to 7 days

**Security Features:**
- ✅ Passwords hashed with bcryptjs (salt rounds: 10)
- ✅ Password never returned in API responses (`.select('-password')`)
- ✅ Input validation on all auth routes using express-validator
- ✅ Password reset tokens hashed with SHA256 and expire after 10 minutes

### 2. Role-Based Access: Investor vs Entrepreneur Dashboards

**Backend:**
- ✅ `roleGuard` middleware created to restrict routes by role
- ✅ User model has `role` field: `enum: ['entrepreneur', 'investor']`

**Frontend:**
- ✅ `RoleRoute` component in App.tsx prevents cross-role access
- ✅ Investors redirected to `/dashboard/investor` if they try to access `/dashboard/entrepreneur`
- ✅ Entrepreneurs redirected to `/dashboard/entrepreneur` if they try to access `/dashboard/investor`
- ✅ Sidebar navigation dynamically changes based on user role
- ✅ Different dashboard views for each role

### 3. APIs for User Registration, Login, Profile Management

**Authentication APIs:**

| Endpoint | Method | Description | Validation |
|----------|--------|-------------|------------|
| /api/auth/register | POST | Create new user account | name, email, password (min 6 chars), role |
| /api/auth/login | POST | Login with email/password/role | email, password |
| /api/auth/forgot-password | POST | Send password reset email | email |
| /api/auth/reset-password/:token | POST | Reset password with token | password (min 6 chars) |

**User/Profile APIs:**

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| GET /api/users/:id | GET | Get user profile by ID | ✅ |
| PUT /api/users/:id | PUT | Update user profile | ✅ (own profile only) |
| PUT /api/users/:id/change-password | PUT | Change password | ✅ (own profile only) |
| GET /api/users/entrepreneurs | GET | List all entrepreneurs | ✅ |
| GET /api/users/investors | GET | List all investors | ✅ |

**Collaboration APIs:**

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| GET /api/collaborations | GET | Get requests for logged-in user | ✅ |
| POST /api/collaborations | POST | Send collaboration request (investor only) | ✅ |
| PATCH /api/collaborations/:id | PATCH | Accept/reject request (entrepreneur only) | ✅ |

### 4. Extended Profile Info Stored in Database

**User Model Fields:**

**Common Fields (All Users):**
- name, email, password (hashed), role, avatarUrl, bio, isOnline
- createdAt, updatedAt (timestamps)

**Entrepreneur-Specific Fields:**
- startupName - Name of the startup
- pitchSummary - Brief pitch description
- fundingNeeded - Amount of funding required
- industry - Industry/sector
- location - Geographic location
- foundedYear - Year startup was founded
- teamSize - Number of team members

**Investor-Specific Fields:**
- investmentInterests - Array of industries interested in
- investmentStage - Array of stages (Seed, Series A, etc.)
- portfolioCompanies - Array of portfolio company names
- totalInvestments - Number of investments made
- minimumInvestment - Minimum investment amount
- maximumInvestment - Maximum investment amount

**Password Reset Fields:**
- resetPasswordToken - Hashed token for password reset
- resetPasswordExpire - Token expiration timestamp

---

## Mock Data Removal ✅

All mock data dependencies have been removed:

**Files Updated to Use Real API:**
- ✅ AuthContext.tsx - All auth functions now call real API
- ✅ EntrepreneurProfile.tsx - Fetches user from API
- ✅ InvestorProfile.tsx - Fetches user from API
- ✅ EntrepreneurDashboard.tsx - Loads entrepreneurs and requests from API
- ✅ InvestorDashboard.tsx - Loads investors and requests from API
- ✅ EntrepreneursPage.tsx - Loads entrepreneurs from API
- ✅ InvestorsPage.tsx - Loads investors from API
- ✅ CollaborationRequestCard.tsx - Fetches investor and updates status via API
- ✅ SettingsPage.tsx - Saves profile and password via API

**Mock Data Files (No Longer Used):**
- src/data/users.ts - ❌ Not imported anywhere
- src/data/messages.ts - ⚠️ Still used by chat (Milestone 3+)
- src/data/collaborationRequests.ts - ❌ Not imported anywhere

---

## How to Run

**Backend:**
```bash
cd C:\Users\GCA\Desktop\NexusProject\backend
npm run dev
```

**Frontend:**
```bash
cd C:\Users\GCA\Desktop\NexusProject\Nexus
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: Connected to Atlas cluster

---

## Testing the Implementation

1. **Register a new entrepreneur:**
   - Go to http://localhost:5173/register
   - Fill in name, email, password, select "Entrepreneur"
   - Check MongoDB Atlas - user should be created

2. **Register a new investor:**
   - Register with "Investor" role
   - Check MongoDB Atlas - user should be created

3. **Login as investor:**
   - Should redirect to `/dashboard/investor`
   - Should see list of entrepreneurs from database

4. **Send collaboration request:**
   - Click on an entrepreneur card
   - Click "Request Collaboration"
   - Check MongoDB - collaboration document should be created

5. **Login as entrepreneur:**
   - Should redirect to `/dashboard/entrepreneur`
   - Should see pending collaboration request

6. **Accept/Reject request:**
   - Click Accept or Decline
   - Status should update in MongoDB

7. **Update profile:**
   - Go to Settings
   - Update name, bio, location
   - Save - should update in MongoDB

8. **Change password:**
   - Go to Settings > Security
   - Enter current password and new password
   - Should update successfully

---

## Database Schema

**Users Collection:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, lowercase),
  password: String (hashed),
  role: String (enum: ['entrepreneur', 'investor']),
  avatarUrl: String,
  bio: String,
  isOnline: Boolean,
  
  // Entrepreneur fields
  startupName: String,
  pitchSummary: String,
  fundingNeeded: String,
  industry: String,
  location: String,
  foundedYear: Number,
  teamSize: Number,
  
  // Investor fields
  investmentInterests: [String],
  investmentStage: [String],
  portfolioCompanies: [String],
  totalInvestments: Number,
  minimumInvestment: String,
  maximumInvestment: String,
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Collaborations Collection:**
```javascript
{
  _id: ObjectId,
  investorId: ObjectId (ref: 'User'),
  entrepreneurId: ObjectId (ref: 'User'),
  message: String,
  status: String (enum: ['pending', 'accepted', 'rejected']),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Next Steps (Milestone 3+)

- Meeting Scheduling
- Video Calling
- Document Processing Chamber
- Payment Section
- Real-time Messaging (replace mock messages.ts)
- Notifications system
- Advanced Security features
