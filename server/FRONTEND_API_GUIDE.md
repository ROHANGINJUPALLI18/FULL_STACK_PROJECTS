# Frontend API Guide (Chat Backend)

This document explains every backend API endpoint, how to call it, and what responses to expect.

Base URL (local):

- `http://localhost:5000`

## 1) Common Rules

### Auth header (for protected routes)

Use this header for all protected endpoints:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Standard error shapes

Most endpoints return:

```json
{
  "success": false,
  "message": "Human readable error message"
}
```

Validation errors (message POST validator):

```json
{
  "success": false,
  "errors": [
    {
      "msg": "Message text cannot be empty",
      "path": "",
      "location": "body"
    }
  ]
}
```

Note:

- `auth.middleware.js` currently returns `{"message":"Unauthorized"}` or `{"message":"Invalid token"}` (without `success` key).

---

## 2) Health Route

### GET `/`

**Meaning:** Quick server health check.

**How to call:**

- No auth required.

**Success (200):**

```json
{
  "message": "Server is running"
}
```

---

## 3) Authentication Routes

### POST `/api/auth/google`

**Meaning:** Login/signup using Google token. Returns user profile + JWT.

**Middleware:**

- `authLimiter` (rate limit: 100 requests / 15 minutes)

**How to call:**

```json
{
  "token": "GOOGLE_ID_TOKEN"
}
```

You can also send:

```json
{
  "credential": "GOOGLE_ID_TOKEN"
}
```

**Success (200):**

```json
{
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "avatar": "...",
    "googleId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "JWT_TOKEN"
}
```

**Error responses:**

- 400: Missing token

```json
{
  "success": false,
  "message": "Google token is required in request body"
}
```

- 429: Rate limit exceeded

```json
{
  "message": "Too many requests, please try again later"
}
```

- 500: Other auth errors (via error middleware)

---

## 4) User Routes

### GET `/api/users/search?q=<text>&limit=<number>`

**Meaning:** Search users by name/email for starting conversations.

**How to call:**

- Protected route (JWT required)

Example:

```http
GET /api/users/search?q=rohan&limit=10
Authorization: Bearer <JWT_TOKEN>
```

**Success (200):**

```json
[
  {
    "_id": "USER_ID",
    "name": "Rohan Sharma",
    "email": "rohan@gmail.com",
    "avatar": "https://..."
  }
]
```

---

## 5) Conversation Routes

### POST `/api/conversations`

**Meaning:** Start a 1-to-1 conversation with another user OR return existing conversation.

**How to call:**

- Protected route (JWT required)

Request body:

```json
// the other user's ID (the one you want to chat with) can be obtained from GET /api/users/search or from JWT payload of the other user
// jwt payload example: { _id: "USER_ID", name: "...", email: "...", avatar: "..." }
// so you can get the other user's ID from their JWT token or from the user search results
// example jwt token payload: { _id: "USER_ID_TO_CHAT_WITH", name: "...", email: "...", avatar: "..." }
{
  "otherUserId": "USER_ID_TO_CHAT_WITH"
}
```

**Success (200):**

```json
{
  "_id": "CONVERSATION_ID",
  "participants": ["USER_ID_1", "USER_ID_2"],
  "isGroup": false,
  "lastMessage": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Error responses:**

- 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- 500 Internal error

```json
{
  "success": false,
  "message": "error description"
}
```

---

### GET `/api/conversations`

**Meaning:** Get all conversations of logged-in user.

**How to call:**

- Protected route (JWT required)

**Success (200):**
Returns array sorted by latest update (`updatedAt` desc).

```json
[
  {
    "_id": "CONVERSATION_ID",
    "participants": [
      {
        "_id": "...",
        "name": "...",
        "avatar": "...",
        "email": "..."
      }
    ],
    "isGroup": false,
    "lastMessage": {
      "_id": "...",
      "text": "...",
      "sender": "...",
      "createdAt": "..."
    },
    "updatedAt": "..."
  }
]
```

**Error responses:**

- 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- 500 Internal error

---

## 6) Message Routes

### POST `/api/messages`

**Meaning:** Create/send a message in a conversation (HTTP path).

**How to call:**

- Protected route (JWT required)
- Validation middleware enabled

Request body:

```json
{
  // conversationId is nothing but the _id of the conversation document in DB which you want to send message to, you can get it from the response of creating a conversation or from the list of conversations endpoint
  "conversationId": "CONVERSATION_ID",
  "text": "Hello"
}
```

or

```json
{
  "conversationId": "CONVERSATION_ID",
  "content": "Hello"
}
```

Optional:

```json
{
  "conversationId": "CONVERSATION_ID",
  "text": "Hello",
  "attachments": ["https://..."]
}
```

Validation rules:

- `conversationId` is required
- message text is required (`text` or `content`)
- max length = 2000 chars

**Success (201):**

```json
{
  "_id": "MESSAGE_ID",
  "conversationId": "CONVERSATION_ID",
  "sender": {
    "_id": "...",
    "name": "...",
    "avatar": "..."
  },
  "text": "Hello",
  "attachments": [],
  "status": "sent",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Error responses:**

- 400 Validation errors

```json
{
  "success": false,
  "errors": [ ... ]
}
```

- 400 Bad body / invalid conversationId

```json
{
  "success": false,
  "message": "conversationId and message text are required"
}
```

or

```json
{
  "success": false,
  "message": "Invalid conversationId"
}
```

- 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

- 403 Not participant

```json
{
  "success": false,
  "message": "You are not a participant in this conversation"
}
```

- 404 Conversation not found

```json
{
  "success": false,
  "message": "Conversation not found"
}
```

- 500 Internal error

---

### GET `/api/messages/:conversationId?page=1&limit=20`

**Meaning:** Fetch paginated message history for one conversation.

**How to call:**

- Protected route (JWT required)

Path params:

- `conversationId` (required)

Query params:

- `page` (default `1`)
- `limit` (default `20`)

**Success (200):**
Returns array of messages sorted by `createdAt: -1` (newest first).

```json
[
  {
    "_id": "MESSAGE_ID",
    "conversationId": "CONVERSATION_ID",
    "sender": {
      "_id": "...",
      "name": "...",
      "avatar": "..."
    },
    "text": "Hello",
    "attachments": [],
    "status": "sent",
    "createdAt": "..."
  }
]
```

**Error responses:**

- 401 Unauthorized
- 403 Not participant
- 404 Conversation not found
- 400 Invalid `conversationId`
- 500 Internal error

(All above use `{ success: false, message: "..." }` shape)

---

## 6) Socket Events (Realtime Chat)

Socket server URL:

- `http://localhost:5000`

Socket CORS:

- `origin = process.env.CLIENT_URL || "http://localhost:5173"`

### Client -> Server

#### `join`

**Meaning:** Join personal user room.

Payload:

```js
userId;
```

Error event if invalid:

```json
{ "message": "Invalid user ID" }
```

#### `joinConversation`

**Meaning:** Join a conversation room.

Payload:

```js
conversationId;
```

Error event if invalid:

```json
{ "message": "Invalid conversation ID" }
```

#### `sendMessage`

**Meaning:** Send message in real-time to all users in that conversation room.

Payload:

```json
{
  "conversationId": "CONVERSATION_ID",
  "senderId": "USER_ID",
  "text": "Hello",
  "attachments": []
}
```

Ack callback from server:

- Success:

```json
{
  "status": "ok",
  "message": { "...full saved message object..." }
}
```

- Error:

```json
{
  "status": "error",
  "message": "error description"
}
```

### Server -> Client

#### `receive_message`

**Meaning:** Broadcast new message to users joined in that `conversationId` room.

Payload:

- Full message object.

#### `error`

**Meaning:** Socket-level error payload.

Payload example:

```json
{ "message": "User not part of this conversation" }
```

---

## 7) Route Summary Table

| Method | Path                            | Protected | Purpose                             |
| ------ | ------------------------------- | --------- | ----------------------------------- |
| GET    | `/`                             | No        | Health check                        |
| POST   | `/api/auth/google`              | No        | Google login/signup, returns JWT    |
| POST   | `/api/conversations`            | Yes       | Create or fetch 1-to-1 conversation |
| GET    | `/api/conversations`            | Yes       | List logged-in user's conversations |
| POST   | `/api/messages`                 | Yes       | Send/create message                 |
| GET    | `/api/messages/:conversationId` | Yes       | Fetch paginated messages            |

---

## 8) Frontend Recommended Call Order

1. `POST /api/auth/google` -> store JWT and user
2. connect socket -> `join(user._id)`
3. `GET /api/conversations`
4. On opening a chat -> `joinConversation(conversationId)`
5. `GET /api/messages/:conversationId?page=1&limit=20`
6. Send message via socket `sendMessage(...)` (preferred realtime path)
7. Listen `receive_message` to update chat UI live
