# Meeting Scheduling System - Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Database seeded with sample data (`node seed.js`)
- API testing tool (Postman, Thunder Client, or curl)

---

## Test Data Overview

After seeding, you have:

**Sample Meeting 1:**
- Organizer: Michael Rodriguez (investor) - `michael@vcinnovate.com`
- Participant: Sarah Johnson (entrepreneur) - `sarah@techwave.io`
- Time: Tomorrow at 10:00 AM (1 hour)
- Status: `accepted`

**Sample Meeting 2:**
- Organizer: Maya Patel (entrepreneur) - `maya@healthpulse.com`
- Participant: Robert Torres (investor) - `robert@healthventures.com`
- Time: Next week at 2:00 PM (1.5 hours)
- Status: `pending`

---

## Step-by-Step Testing

### Step 1: Get JWT Token

First, login to get authentication token.

**Request:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "michael@vcinnovate.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Copy the token** - you'll need it for all subsequent requests.

---

### Step 2: Get All Meetings

**Request:**
```
GET http://localhost:5000/api/meetings
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
[
  {
    "_id": "...",
    "title": "Initial Investment Discussion",
    "organizerId": {
      "name": "Michael Rodriguez",
      "email": "michael@vcinnovate.com",
      ...
    },
    "participantId": {
      "name": "Sarah Johnson",
      "email": "sarah@techwave.io",
      ...
    },
    "startTime": "2024-01-XX...",
    "endTime": "2024-01-XX...",
    "status": "accepted",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "location": "Virtual"
  }
]
```

✅ **Verify:** Michael should see 1 meeting (with Sarah)

---

### Step 3: Filter Meetings by Status

**Request:**
```
GET http://localhost:5000/api/meetings?status=accepted
Authorization: Bearer YOUR_TOKEN_HERE
```

✅ **Verify:** Should return only accepted meetings

**Try other filters:**
```
GET /api/meetings?status=pending
GET /api/meetings?status=rejected
GET /api/meetings?status=cancelled
```

---

### Step 4: Create New Meeting (Success)

**Request:**
```
POST http://localhost:5000/api/meetings
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Follow-up Discussion",
  "description": "Discuss next steps for investment",
  "participantId": "DAVID_USER_ID",
  "startTime": "2024-01-25T15:00:00.000Z",
  "endTime": "2024-01-25T16:00:00.000Z",
  "meetingLink": "https://zoom.us/j/123456789",
  "location": "Virtual"
}
```

**Note:** Replace `DAVID_USER_ID` with David's actual `_id` from the database.

**To get David's ID:**
```
GET http://localhost:5000/api/users/entrepreneurs
Authorization: Bearer YOUR_TOKEN_HERE
```

✅ **Verify:** 
- Response status: `201 Created`
- Meeting created with status `pending`
- Meeting appears in both Michael's and David's meeting lists

---

### Step 5: Test Conflict Detection (Should Fail)

Try to create a meeting that overlaps with the existing meeting.

**Request:**
```
POST http://localhost:5000/api/meetings
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Conflicting Meeting",
  "participantId": "JAMES_USER_ID",
  "startTime": "TOMORROW_AT_10:30",
  "endTime": "TOMORROW_AT_11:30",
  "location": "Virtual"
}
```

**Expected Response:**
```json
{
  "message": "You have a scheduling conflict",
  "conflicts": [
    {
      "_id": "...",
      "title": "Initial Investment Discussion",
      "startTime": "...",
      "endTime": "..."
    }
  ]
}
```

✅ **Verify:** 
- Response status: `409 Conflict`
- Conflict details returned
- Meeting NOT created

---

### Step 6: Test Past Date Validation (Should Fail)

**Request:**
```
POST http://localhost:5000/api/meetings
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Past Meeting",
  "participantId": "SARAH_USER_ID",
  "startTime": "2023-01-01T10:00:00.000Z",
  "endTime": "2023-01-01T11:00:00.000Z"
}
```

**Expected Response:**
```json
{
  "message": "Cannot schedule meetings in the past"
}
```

✅ **Verify:** Response status: `400 Bad Request`

---

### Step 7: Accept Meeting (As Participant)

Login as Sarah and accept the pending meeting.

**1. Login as Sarah:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "sarah@techwave.io",
  "password": "password123"
}
```

**2. Get Sarah's meetings:**
```
GET http://localhost:5000/api/meetings
Authorization: Bearer SARAH_TOKEN
```

**3. Accept the meeting:**
```
PATCH http://localhost:5000/api/meetings/MEETING_ID/status
Authorization: Bearer SARAH_TOKEN
Content-Type: application/json

{
  "status": "accepted"
}
```

✅ **Verify:** 
- Meeting status changes to `accepted`
- Both Michael and Sarah see updated status

---

### Step 8: Reject Meeting (As Participant)

Login as Robert and reject Maya's meeting.

**1. Login as Robert:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "robert@healthventures.com",
  "password": "password123"
}
```

**2. Get Robert's meetings:**
```
GET http://localhost:5000/api/meetings
Authorization: Bearer ROBERT_TOKEN
```

**3. Reject the meeting:**
```
PATCH http://localhost:5000/api/meetings/MEETING_ID/status
Authorization: Bearer ROBERT_TOKEN
Content-Type: application/json

{
  "status": "rejected"
}
```

✅ **Verify:** Meeting status changes to `rejected`

---

### Step 9: Update Meeting (As Organizer)

Login as Michael and update meeting details.

**Request:**
```
PUT http://localhost:5000/api/meetings/MEETING_ID
Authorization: Bearer MICHAEL_TOKEN
Content-Type: application/json

{
  "title": "Updated: Investment Discussion",
  "description": "Updated description with agenda",
  "meetingLink": "https://meet.google.com/new-link-xyz"
}
```

✅ **Verify:** 
- Meeting details updated
- Only specified fields changed
- Other fields remain unchanged

---

### Step 10: Update Meeting Time (With Conflict Check)

**Request:**
```
PUT http://localhost:5000/api/meetings/MEETING_ID
Authorization: Bearer MICHAEL_TOKEN
Content-Type: application/json

{
  "startTime": "2024-01-26T10:00:00.000Z",
  "endTime": "2024-01-26T11:00:00.000Z"
}
```

✅ **Verify:** 
- If no conflicts: Meeting time updated
- If conflicts: Returns 409 with conflict details

---

### Step 11: Cancel Meeting

**Request:**
```
PATCH http://localhost:5000/api/meetings/MEETING_ID/status
Authorization: Bearer MICHAEL_TOKEN
Content-Type: application/json

{
  "status": "cancelled"
}
```

✅ **Verify:** 
- Meeting status changes to `cancelled`
- Both organizer and participant can cancel

---

### Step 12: Delete Meeting (As Organizer)

**Request:**
```
DELETE http://localhost:5000/api/meetings/MEETING_ID
Authorization: Bearer MICHAEL_TOKEN
```

**Expected Response:**
```json
{
  "message": "Meeting deleted successfully"
}
```

✅ **Verify:** 
- Meeting removed from database
- No longer appears in meeting lists

---

### Step 13: Test Authorization (Should Fail)

Try to update a meeting you didn't organize.

**1. Login as Sarah**
**2. Try to update Michael's meeting:**
```
PUT http://localhost:5000/api/meetings/MICHAELS_MEETING_ID
Authorization: Bearer SARAH_TOKEN
Content-Type: application/json

{
  "title": "Trying to update"
}
```

**Expected Response:**
```json
{
  "message": "Only the organizer can update meeting details"
}
```

✅ **Verify:** Response status: `403 Forbidden`

---

### Step 14: Test Participant Conflict Detection

**1. Login as David**
**2. Create meeting with Sarah (who already has a meeting tomorrow at 10 AM)**
```
POST http://localhost:5000/api/meetings
Authorization: Bearer DAVID_TOKEN
Content-Type: application/json

{
  "title": "Meeting with Sarah",
  "participantId": "SARAH_USER_ID",
  "startTime": "TOMORROW_AT_10:30",
  "endTime": "TOMORROW_AT_11:30"
}
```

**Expected Response:**
```json
{
  "message": "Sarah Johnson has a scheduling conflict",
  "conflicts": [...]
}
```

✅ **Verify:** Participant's conflicts are also checked

---

### Step 15: Filter by Date Range

**Request:**
```
GET http://localhost:5000/api/meetings?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer YOUR_TOKEN
```

✅ **Verify:** Only meetings within date range returned

---

## Quick Test Checklist

✅ Get all meetings  
✅ Get single meeting by ID  
✅ Create meeting successfully  
✅ Conflict detection works (organizer)  
✅ Conflict detection works (participant)  
✅ Past date validation  
✅ End time validation (must be after start time)  
✅ Accept meeting (participant only)  
✅ Reject meeting (participant only)  
✅ Cancel meeting (both can cancel)  
✅ Update meeting (organizer only)  
✅ Update meeting time with conflict check  
✅ Delete meeting (organizer only)  
✅ Authorization checks work  
✅ Filter by status  
✅ Filter by date range  
✅ Cannot schedule with yourself  
✅ Participant must exist  

---

## Common Error Scenarios

| Scenario | Expected Result |
|----------|----------------|
| Missing required fields | 400 Bad Request |
| Invalid date format | 400 Bad Request |
| End time before start time | 400 Bad Request |
| Past date | 400 Bad Request |
| Scheduling conflict | 409 Conflict |
| Participant not found | 404 Not Found |
| Meeting not found | 404 Not Found |
| Not authorized | 403 Forbidden |
| No token provided | 401 Unauthorized |
| Invalid token | 401 Unauthorized |

---

## Testing with Postman Collection

You can import this collection to Postman for easier testing:

**Collection Structure:**
```
Nexus - Meeting Scheduling
├── Auth
│   └── Login
├── Meetings
│   ├── Get All Meetings
│   ├── Get Meeting by ID
│   ├── Create Meeting
│   ├── Update Meeting
│   ├── Update Meeting Status
│   └── Delete Meeting
└── Test Scenarios
    ├── Test Conflict Detection
    ├── Test Past Date Validation
    └── Test Authorization
```

---

## Next Steps

After backend testing is complete:
1. ✅ All APIs working correctly
2. 🔄 Integrate with frontend calendar component
3. 🔄 Add real-time notifications for meeting updates
4. 🔄 Add email reminders for upcoming meetings

---

**Meeting Scheduling Backend is ready for frontend integration!** 🚀
