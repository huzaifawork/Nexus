# Meeting Scheduling System API Documentation

## Overview
The Meeting Scheduling System allows investors and entrepreneurs to schedule, manage, and track meetings. It includes automatic conflict detection to prevent double-booking.

---

## Features
- ✅ Create, read, update, delete meetings
- ✅ Accept/reject meeting invitations
- ✅ Automatic conflict detection (prevents double-booking)
- ✅ Filter meetings by status and date range
- ✅ Support for virtual and in-person meetings
- ✅ Link meetings to collaboration requests
- ✅ Role-based access control

---

## API Endpoints

### 1. Get All Meetings
**GET** `/api/meetings`

Get all meetings for the logged-in user (as organizer or participant).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `accepted`, `rejected`, `cancelled`)
- `startDate` (optional): Filter meetings from this date (ISO 8601 format)
- `endDate` (optional): Filter meetings until this date (ISO 8601 format)

**Example Request:**
```
GET /api/meetings?status=pending&startDate=2024-01-01
```

**Response (200 OK):**
```json
[
  {
    "_id": "65f1234567890abcdef12345",
    "title": "Initial Investment Discussion",
    "description": "Discuss funding requirements",
    "organizerId": {
      "_id": "65f1234567890abcdef11111",
      "name": "Michael Rodriguez",
      "email": "michael@vcinnovate.com",
      "avatarUrl": "https://...",
      "role": "investor"
    },
    "participantId": {
      "_id": "65f1234567890abcdef22222",
      "name": "Sarah Johnson",
      "email": "sarah@techwave.io",
      "avatarUrl": "https://...",
      "role": "entrepreneur"
    },
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "status": "accepted",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "location": "Virtual",
    "notes": "",
    "collaborationId": "65f1234567890abcdef33333",
    "createdAt": "2024-01-10T08:30:00.000Z",
    "updatedAt": "2024-01-10T08:30:00.000Z"
  }
]
```

---

### 2. Get Single Meeting
**GET** `/api/meetings/:id`

Get details of a specific meeting.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "_id": "65f1234567890abcdef12345",
  "title": "Initial Investment Discussion",
  "description": "Discuss funding requirements",
  "organizerId": { ... },
  "participantId": { ... },
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "status": "accepted",
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "location": "Virtual",
  "notes": "",
  "collaborationId": "65f1234567890abcdef33333",
  "createdAt": "2024-01-10T08:30:00.000Z",
  "updatedAt": "2024-01-10T08:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Meeting not found
- `403 Forbidden`: Not authorized to view this meeting

---

### 3. Create Meeting
**POST** `/api/meetings`

Schedule a new meeting with another user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Investment Discussion",
  "description": "Discuss Series A funding",
  "participantId": "65f1234567890abcdef22222",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "location": "Virtual",
  "notes": "Please review pitch deck before meeting",
  "collaborationId": "65f1234567890abcdef33333"
}
```

**Required Fields:**
- `title` (string): Meeting title
- `participantId` (string): User ID of the other participant
- `startTime` (ISO 8601 date): Meeting start time
- `endTime` (ISO 8601 date): Meeting end time

**Optional Fields:**
- `description` (string): Meeting description
- `meetingLink` (string): Virtual meeting link
- `location` (string): Meeting location
- `notes` (string): Additional notes
- `collaborationId` (string): Link to collaboration request

**Response (201 Created):**
```json
{
  "_id": "65f1234567890abcdef12345",
  "title": "Investment Discussion",
  "organizerId": { ... },
  "participantId": { ... },
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "status": "pending",
  ...
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid data
- `404 Not Found`: Participant not found
- `409 Conflict`: Scheduling conflict detected

**Conflict Response Example:**
```json
{
  "message": "You have a scheduling conflict",
  "conflicts": [
    {
      "_id": "65f1234567890abcdef99999",
      "title": "Existing Meeting",
      "startTime": "2024-01-15T09:30:00.000Z",
      "endTime": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Update Meeting
**PUT** `/api/meetings/:id`

Update meeting details (only organizer can update).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Meeting Title",
  "description": "Updated description",
  "startTime": "2024-01-15T11:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z",
  "meetingLink": "https://zoom.us/j/123456789",
  "location": "Conference Room A",
  "notes": "Updated notes"
}
```

**All fields are optional** - only include fields you want to update.

**Response (200 OK):**
```json
{
  "_id": "65f1234567890abcdef12345",
  "title": "Updated Meeting Title",
  ...
}
```

**Error Responses:**
- `403 Forbidden`: Only organizer can update meeting
- `404 Not Found`: Meeting not found
- `409 Conflict`: New time conflicts with existing meetings

---

### 5. Update Meeting Status
**PATCH** `/api/meetings/:id/status`

Accept, reject, or cancel a meeting.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Valid Status Values:**
- `accepted`: Participant accepts the meeting
- `rejected`: Participant rejects the meeting
- `cancelled`: Organizer or participant cancels the meeting

**Authorization Rules:**
- **Participant** can: accept or reject
- **Organizer** can: cancel
- **Both** can: cancel

**Response (200 OK):**
```json
{
  "_id": "65f1234567890abcdef12345",
  "status": "accepted",
  ...
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status value
- `403 Forbidden`: Not authorized to perform this action
- `404 Not Found`: Meeting not found

---

### 6. Delete Meeting
**DELETE** `/api/meetings/:id`

Delete a meeting (only organizer can delete).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "message": "Meeting deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Only organizer can delete meeting
- `404 Not Found`: Meeting not found

---

## Conflict Detection

The system automatically prevents double-booking by checking for conflicts when:
1. Creating a new meeting
2. Updating meeting time

**Conflict Detection Logic:**
A conflict exists if the new meeting:
- Starts during an existing meeting
- Ends during an existing meeting
- Completely contains an existing meeting

**Only checks conflicts with:**
- Meetings with status `pending` or `accepted`
- Meetings where the user is organizer or participant

**Example Conflict Scenario:**
```
Existing Meeting: 10:00 AM - 11:00 AM
New Meeting:      10:30 AM - 11:30 AM
Result:           ❌ CONFLICT (overlaps)

Existing Meeting: 10:00 AM - 11:00 AM
New Meeting:      11:00 AM - 12:00 PM
Result:           ✅ NO CONFLICT (back-to-back is allowed)
```

---

## Meeting Status Flow

```
pending → accepted (participant accepts)
pending → rejected (participant rejects)
pending → cancelled (organizer or participant cancels)
accepted → cancelled (organizer or participant cancels)
```

**Status Meanings:**
- `pending`: Waiting for participant to accept/reject
- `accepted`: Both parties confirmed the meeting
- `rejected`: Participant declined the meeting
- `cancelled`: Meeting was cancelled by either party

---

## Database Schema

```javascript
{
  title: String (required),
  description: String,
  organizerId: ObjectId (ref: User, required),
  participantId: ObjectId (ref: User, required),
  startTime: Date (required),
  endTime: Date (required),
  status: String (enum: ['pending', 'accepted', 'rejected', 'cancelled']),
  meetingLink: String,
  location: String,
  notes: String,
  collaborationId: ObjectId (ref: Collaboration),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing with Sample Data

After running `node seed.js`, you'll have:

**Sample Meeting 1:**
- Organizer: Michael Rodriguez (investor)
- Participant: Sarah Johnson (entrepreneur)
- Time: Tomorrow at 10:00 AM (1 hour)
- Status: accepted

**Sample Meeting 2:**
- Organizer: Maya Patel (entrepreneur)
- Participant: Robert Torres (investor)
- Time: Next week at 2:00 PM (1.5 hours)
- Status: pending

---

## Example Usage Scenarios

### Scenario 1: Investor Schedules Meeting with Entrepreneur
```javascript
// 1. Investor (Michael) creates meeting with entrepreneur (Sarah)
POST /api/meetings
{
  "title": "Series A Discussion",
  "participantId": "sarah_id",
  "startTime": "2024-01-20T14:00:00Z",
  "endTime": "2024-01-20T15:00:00Z",
  "meetingLink": "https://meet.google.com/xyz"
}

// 2. Sarah receives meeting (status: pending)
GET /api/meetings
// Returns meeting with status "pending"

// 3. Sarah accepts the meeting
PATCH /api/meetings/meeting_id/status
{ "status": "accepted" }

// 4. Both can see accepted meeting in their calendars
GET /api/meetings?status=accepted
```

### Scenario 2: Conflict Detection
```javascript
// Michael has meeting: 2:00 PM - 3:00 PM

// Try to schedule overlapping meeting: 2:30 PM - 3:30 PM
POST /api/meetings
{
  "title": "Another Meeting",
  "participantId": "david_id",
  "startTime": "2024-01-20T14:30:00Z",
  "endTime": "2024-01-20T15:30:00Z"
}

// Response: 409 Conflict
{
  "message": "You have a scheduling conflict",
  "conflicts": [...]
}
```

---

## Error Codes Summary

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing fields, invalid dates, past dates |
| 403 | Forbidden | Not authorized to perform action |
| 404 | Not Found | Meeting or participant doesn't exist |
| 409 | Conflict | Scheduling conflict detected |
| 500 | Server Error | Database or server issue |

---

## Best Practices

1. **Always check for conflicts** before showing available time slots
2. **Use ISO 8601 format** for all dates (e.g., `2024-01-15T10:00:00.000Z`)
3. **Validate dates on frontend** before sending to API
4. **Handle 409 conflicts gracefully** - show alternative time slots
5. **Populate user data** when displaying meetings
6. **Filter by date range** for calendar views
7. **Show meeting status** with visual indicators

---

## Integration with Frontend Calendar

The API is designed to work with calendar libraries like:
- FullCalendar
- React Big Calendar
- React Calendar
- Custom calendar implementations

**Recommended Flow:**
1. Fetch meetings for date range: `GET /api/meetings?startDate=X&endDate=Y`
2. Display meetings on calendar
3. On time slot click, check for conflicts before showing form
4. Create meeting with selected time
5. Handle conflicts by suggesting alternative times
6. Update calendar on status changes

---

**Meeting Scheduling System is ready for integration!** 🚀
