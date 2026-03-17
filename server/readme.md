# Chat Application — Backend API Contract Documentation

> This document is the **single source of truth** between the backend and frontend.
> Read this before writing a single line of frontend code.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Variables](#environment-variables)
3. [Database Models](#database-models)
4. [Authentication API](#1-authentication-api)
5. [Conversation APIs](#2-conversation-apis)
6. [Message APIs](#3-message-apis)
7. [Socket.IO Events](#4-socketio-events)
8. [End-to-End User Flow](#5-end-to-end-user-flow)
9. [Request / Response Conventions](#6-request--response-conventions)

---

## Architecture Overview

```
Client (React / Mobile)
        │
        ├── REST (HTTP)  ──►  Express App (app.js)
        │                          │
        │                    ┌─────┴──────────────────────────┐
        │                    │         Middleware              │
        │                    │  logger → express.json → cors  │
        │                    │  protect (JWT auth)             │
        │                    │  notFound → errorMiddleware     │
        │                    └─────┬──────────────────────────┘
        │                          │
        │               ┌──────────┼─────────────┐
        │           authRoutes  convRoutes  msgRoutes
        │               │          │             │
        │          Controllers ──► Services ──► Models (MongoDB)
        │
        └── WebSocket ──►  Socket.IO Server (socketServer.js)
                                   │
                            registerChatHandlers (chat.socket.js)
                                   │
                              Services ──► Models (MongoDB)
```

**Startup sequence** (`server.js`):

1. `dotenv.config()` — load env vars
2. `connectDB()` — connect to MongoDB
3. `http.createServer(app)` — create HTTP server
4. `setupSocket(server)` — attach Socket.IO
5. `server.listen(PORT)` — start listening

---

## Environment Variables

| Variable           | Used In                             | Description                                                    |
| ------------------ | ----------------------------------- | -------------------------------------------------------------- |
| `PORT`             | server.js                           | HTTP port (default: `5000`)                                    |
| `MONGO_URI`        | config/db.js                        | MongoDB connection string                                      |
| `GOOGLE_CLIENT_ID` | services/auth.service.js            | Google OAuth Client ID                                         |
| `JWT_SECRET`       | auth.service.js, auth.middleware.js | Secret for signing/verifying JWTs                              |
| `JWT_EXPIRES`      | services/auth.service.js            | JWT lifetime e.g. `"7d"`, `"24h"`                              |
| `CLIENT_URL`       | sockets/socketServer.js             | Frontend origin for Socket CORS (e.g. `http://localhost:5173`) |

**.env example:**

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chat_app
GOOGLE_CLIENT_ID=your_google_client_id_here
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
```

---

## Database Models

### User (`user.model.js`)

| Field       | Type   | Required | Unique | Notes                           |
| ----------- | ------ | -------- | ------ | ------------------------------- |
| `name`      | String | ✅       |        |                                 |
| `email`     | String | ✅       | ✅     |                                 |
| `avatar`    | String | ✅       |        | URL from Google profile picture |
| `googleId`  | String | ✅       | ✅     | Google OAuth `sub` field        |
| `createdAt` | Date   |          |        | Auto (timestamps)               |
| `updatedAt` | Date   |          |        | Auto (timestamps)               |

### Conversation (`conversation.model.js`)

| Field          | Type       | Notes                                    |
| -------------- | ---------- | ---------------------------------------- |
| `participants` | ObjectId[] | Refs → `User`                            |
| `isGroup`      | Boolean    | Default `false`                          |
| `name`         | String     | Group name (optional for 1-1 chats)      |
| `lastMessage`  | ObjectId   | Ref → `Message`, updated on each new msg |
| `createdAt`    | Date       | Auto                                     |
| `updatedAt`    | Date       | Auto, used for sorting conversations     |

### Message (`message.model.js`)

| Field            | Type     | Required | Notes                                                 |
| ---------------- | -------- | -------- | ----------------------------------------------------- |
| `conversationId` | ObjectId | ✅       | Ref → `Conversation`                                  |
| `sender`         | ObjectId | ✅       | Ref → `User`                                          |
| `text`           | String   |          | Plain text content                                    |
| `attachments`    | String[] |          | Array of file/image URLs                              |
| `status`         | String   |          | `"sent"` / `"delivered"` / `"read"`, default `"sent"` |
| `createdAt`      | Date     |          | Auto                                                  |
| `updatedAt`      | Date     |          | Auto                                                  |

---

## 1. Authentication API

### Google OAuth Login

**Function call chain:**

```
<!--  -->
POST /api/auth/google
  └── googleAuth (auth.controller.js)
        └── googleLogin(token) (auth.service.js)
              ├── client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID })
              ├── extract { email, name, picture, sub } from payload
              ├── User.findOne({ email })
              ├── if not found → User.create({ name, email, avatar: picture, googleId: sub })
              └── jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
```

**Endpoint:**

```
POST /api/auth/google
```

**Request Body:**

```json
{
  "token": "GOOGLE_ID_TOKEN"
}
```

> `token` can also be sent as `credential` — the controller accepts both.

**Success Response `200`:**

```json
{
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Rohan",
    "email": "rohan@gmail.com",
    "avatar": "https://lh3.googleusercontent.com/...",
    "googleId": "1085234567890",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

| Status | When                           | Body                                                                          |
| ------ | ------------------------------ | ----------------------------------------------------------------------------- |
| `400`  | `token` not sent in body       | `{ "success": false, "message": "Google token is required in request body" }` |
| `500`  | Google token invalid / expired | `{ "success": false, "message": "error description" }` via `errorMiddleware`  |

**JWT Payload (decoded):**

```json
// the meaning of iat and exp:
// iat = issued at (timestamp when token was created)
// exp = expiration time (timestamp when token expires)
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "iat": 1700000000,
  "exp": 1700604800
}
```

**Frontend must:**

1. Store `token` (JWT) — in `localStorage` or `sessionStorage`
2. Attach it to every subsequent protected request:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 2. Conversation APIs

> All routes require `Authorization: Bearer <JWT>` header.

**`protect` middleware** (`auth.middleware.js`) runs before every conversation route:

- Extracts token from `Authorization: Bearer <token>`
- Verifies with `jwt.verify(token, JWT_SECRET)`
- Sets `req.user = decoded` (decoded = the JWT payload)

---

### Create / Get 1-1 Conversation

**Function call chain:**

```
POST /api/conversations
  └── protect middleware  →  req.user = { userId, iat, exp }
  └── startConversation (conversation.controller.js)
        └── getConversation(userId, otherUserId) (conversation.service.js)
              ├── Conversation.findOne({ participants: { $all: [userId, otherUserId] }, isGroup: false })
              └── if not found → new Conversation({ participants: [userId, otherUserId], isGroup: false }).save()
```

**Endpoint:**

```
POST /api/conversations
```

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "otherUserId": "64f1a2b3c4d5e6f7a8b9c0d2"
}
```

**Success Response `200`:**

```json
{
  "_id": "64f9a1b2c3d4e5f6a7b8c9d0",
  "participants": ["64f1a2b3c4d5e6f7a8b9c0d1", "64f1a2b3c4d5e6f7a8b9c0d2"],
  "isGroup": false,
  "lastMessage": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

> If the conversation already exists between the two users, it is **returned, not duplicated**.

---

### Get All Conversations for Logged-In User

**Function call chain:**

```
GET /api/conversations
  └── protect middleware
  └── listConversations (conversation.controller.js)
        └── getUserConversations(userId) (conversation.service.js)
              └── Conversation.find({ participants: userId })
                    .populate("participants", "name avatar email")
                    .populate("lastMessage")
                    .sort({ updatedAt: -1 })
```

**Endpoint:**

```
GET /api/conversations
```

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response `200`:**

```json
[
  {
    "_id": "64f9a1b2c3d4e5f6a7b8c9d0",
    "participants": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Rohan",
        "avatar": "https://...",
        "email": "rohan@gmail.com"
      },
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
        "name": "Priya",
        "avatar": "https://...",
        "email": "priya@gmail.com"
      }
    ],
    "isGroup": false,
    "lastMessage": {
      "_id": "64fabc123",
      "text": "Hello!",
      "sender": "64f1a2b3c4d5e6f7a8b9c0d2",
      "createdAt": "2024-01-01T10:00:00.000Z"
    },
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
]
```

> Sorted by `updatedAt` descending — most recently active conversation first.

---

## 3. Message APIs

> All routes require `Authorization: Bearer <JWT>` header.

### Send a Message

**Function call chain:**

```
POST /api/messages
  └── protect middleware
  └── sendMessage (message.controller.js)
        ├── validateParticipant(conversationId, senderId) (message.service.js)
        │     ├── Conversation.findById(conversationId)
        │     └── conversation.participants.includes(senderId)
        └── createMessage({ conversationId, sender: senderId, text: content }) (message.service.js)
              ├── new Message({ conversationId, sender, text, attachments }).save()
              ├── Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id })
              └── Message.findById(message._id).populate("sender", "name avatar")
```

**Endpoint:**

```
POST /api/messages
```

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "conversationId": "64f9a1b2c3d4e5f6a7b8c9d0",
  "text": "Hello, how are you?"
}
```

> Both `text` and `content` field names are accepted — the controller maps either to the message body.

**Validation rules (applied before handler):**

- `conversationId` — required, must not be empty
- `text` / `content` — required, must not be empty, max 2000 characters

**Success Response `201`:**

```json
{
  "_id": "64fabc1234567890abcdef12",
  "conversationId": "64f9a1b2c3d4e5f6a7b8c9d0",
  "sender": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Rohan",
    "avatar": "https://..."
  },
  "text": "Hello, how are you?",
  "attachments": [],
  "status": "sent",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

**Error Responses:**

| Status | When                                     | Body                                                                                |
| ------ | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `400`  | Missing `conversationId` or `text`       | `{ "success": false, "message": "conversationId and message text are required" }`   |
| `400`  | Validation failure (empty/too long text) | `{ "success": false, "errors": [...] }`                                             |
| `401`  | No or invalid JWT                        | `{ "success": false, "message": "Unauthorized" }`                                   |
| `403`  | Sender is not a conversation participant | `{ "success": false, "message": "You are not a participant in this conversation" }` |
| `404`  | Conversation not found                   | `{ "success": false, "message": "Conversation not found" }`                         |
| `500`  | DB error or other failure                | `{ "success": false, "message": "Failed to create message", "details": "..." }`     |

---

### Fetch Messages (Paginated)

**Function call chain:**

```
GET /api/messages/:conversationId
  └── protect middleware
  └── fetchMessages (message.controller.js)
        ├── validateParticipant(conversationId, userId) (message.service.js)
        └── getMessages(conversationId, page, limit) (message.service.js)
              └── Message.find({ conversationId })
                    .populate("sender", "name avatar")
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
```

**Endpoint:**

```
GET /api/messages/:conversationId?page=1&limit=20
```

**Headers:**

```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**

| Param   | Type   | Default | Description       |
| ------- | ------ | ------- | ----------------- |
| `page`  | Number | `1`     | Page number       |
| `limit` | Number | `20`    | Messages per page |

**Example:**

```
GET /api/messages/64f9a1b2c3d4e5f6a7b8c9d0?page=1&limit=20
```

**Success Response `200`:**

```json
[
  {
    "_id": "64fabc12",
    "conversationId": "64f9a1b2c3d4e5f6a7b8c9d0",
    "sender": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Rohan",
      "avatar": "https://..."
    },
    "text": "Hello, how are you?",
    "attachments": [],
    "status": "sent",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
]
```

> Sorted newest first (`createdAt: -1`). Frontend should reverse the array before rendering.

**Error Responses:**

| Status | When                                   | Body                                                                                |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------------- |
| `401`  | No or invalid JWT                      | `{ "success": false, "message": "Unauthorized" }`                                   |
| `403`  | User is not a conversation participant | `{ "success": false, "message": "You are not a participant in this conversation" }` |
| `404`  | Conversation not found                 | `{ "success": false, "message": "Conversation not found" }`                         |
| `500`  | DB error                               | `{ "success": false, "message": "Failed to get messages", "details": "..." }`       |

---

## 4. Socket.IO Events

**Server setup:** Socket.IO is attached to the same HTTP server as Express, on the same port.

```
ws://localhost:5000
```

**CORS:** restricted to `CLIENT_URL` env variable (defaults to `http://localhost:5173`). Only the configured frontend origin can connect.

---

### Connection

```js
// Frontend
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");
```

---

### Events Reference

#### Client → Server

| Event              | Payload                                            | Purpose                                         |
| ------------------ | -------------------------------------------------- | ----------------------------------------------- |
| `join`             | `userId` (String)                                  | Join the user's personal room for notifications |
| `joinConversation` | `conversationId` (String)                          | Join a conversation room to get live messages   |
| `sendMessage`      | `{ conversationId, senderId, text, attachments? }` | Send a new chat message via socket              |

#### Server → Client

| Event             | Payload                                  | Purpose                                        |
| ----------------- | ---------------------------------------- | ---------------------------------------------- |
| `receive_message` | Full message object (see Message schema) | Broadcast new message to all room participants |
| `error`           | `{ message: "error description" }`       | Sent on invalid input or failed message send   |
| `receive_message` | Full message object (see Message schema) | Broadcast new message to all room participants |
| `error`           | `{ message: "error description" }`       | Sent on invalid input or failed message send   |

---

### Event Detail: `join`

```js
// Client emits after login
socket.emit("join", userId);

// Server: socket.join(userId)
// Purpose: enables private notifications/messages to this specific user later
```

---

### Event Detail: `joinConversation`

```js
// Client emits when opening a chat window
socket.emit("joinConversation", conversationId);

// Server: socket.join(conversationId)
// Every participant of a conversation must emit this to receive messages
```

---

### Event Detail: `sendMessage`

```js
// Client emits
socket.emit(
  "sendMessage",
  {
    conversationId: "64f9a1b2c3d4e5f6a7b8c9d0",
    senderId: "64f1a2b3c4d5e6f7a8b9c0d1",
    text: "Hello!",
    attachments: [], // optional, array of URLs
  },
  (ack) => {
    // Server sends back acknowledgement
    if (ack.status === "ok") {
      console.log("Message sent:", ack.message); // full saved message
    } else {
      console.error("Failed to send:", ack.message);
    }
  },
);
```

**Server internally calls:**

1. `validateParticipant(conversationId, senderId)` — checks DB
2. `createMessage({ conversationId, sender: senderId, text, attachments })`
3. Emits `receive_message` to room `conversationId`
4. Calls acknowledgement callback with `{ status: "ok", message }` or `{ status: "error", message }`

```js
// All clients in the conversation room receive:
socket.on("receive_message", (message) => {
  // message = full Message document with populated sender
  console.log(message.text, message.sender.name);
});
```

---

### Event Detail: `error`

```js
// Server emits on any socket failure
socket.on("error", ({ message }) => {
  console.error("Socket error:", message);
  // "Invalid user ID"
  // "Invalid conversation ID"
  // "User not part of this conversation"
  // "Conversation not found"
});
```

---

### Socket Disconnect

```js
socket.on("disconnect", () => {
  // Server logs: "User disconnected from chat socket: <socketId>"
  // Rooms are automatically cleaned up by Socket.IO
});
```

---

## 5. End-to-End User Flow

### Full flow from login to real-time chat

```
1. USER OPENS APP
   └── Frontend calls POST /api/auth/google with Google ID token
   └── Backend: verifies token → finds/creates User in DB → returns { user, token (JWT) }
   └── Frontend: stores JWT in localStorage

2. SOCKET CONNECTION
   └── Frontend: const socket = io("http://localhost:5000")
   └── Frontend: socket.emit("join", user._id)
   └── Backend: socket.join(userId) — user is now in their personal room

3. LOAD CONVERSATIONS
   └── Frontend calls GET /api/conversations
       Header: Authorization: Bearer <JWT>
   └── Backend: finds all conversations where user is a participant
               populates participant names/avatars + lastMessage
   └── Frontend: renders conversation list sorted by recent activity

4. OPEN A CONVERSATION
   └── Frontend calls POST /api/conversations  { otherUserId }
       (creates new OR returns existing 1-1 conversation)
   └── Frontend: socket.emit("joinConversation", conversationId)
   └── Backend: socket.join(conversationId)
   └── Frontend calls GET /api/messages/:conversationId?page=1
   └── Frontend: renders message history (reverse the array for oldest-first display)

5. SEND A MESSAGE (Real-time via Socket)
   └── Frontend: socket.emit("sendMessage", { conversationId, senderId, text }, callback)
   └── Backend:
       ├── validateParticipant → ensures sender is in the conversation
       ├── createMessage → saves to DB, updates conversation.lastMessage
       ├── io.to(conversationId).emit("receive_message", message)
       └── callback({ status: "ok", message }) sent back to sender only
   └── All clients in the room receive "receive_message" and update their UI

6. RECEIVE A MESSAGE
   └── socket.on("receive_message", (message) => { append to chat UI })

7. LOGOUT / DISCONNECT
   └── Frontend: socket.disconnect()
   └── Frontend: clear JWT from localStorage
```

---

## 6. Request / Response Conventions

### Standard Header for Protected Routes

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### HTTP Status Codes Used

| Code  | Meaning                                                    |
| ----- | ---------------------------------------------------------- |
| `200` | Success (GET, successful POST returning existing resource) |
| `201` | Created (new message created)                              |
| `400` | Bad request (missing required fields / validation fail)    |
| `401` | Unauthorized (no token or invalid token)                   |
| `403` | Forbidden (valid token but not a participant)              |
| `404` | Route not found                                            |
| `500` | Internal server error                                      |

### Standard Error Response Shape

Every error response across all endpoints follows this shape:

```json
{
  "success": false,
  "message": "Human-readable description of the error"
}
```

Validation errors (from input validators) return an extra `errors` array:

```json
{
  "success": false,
  "errors": [
    { "msg": "conversationId is required", "path": "conversationId" },
    { "msg": "Message text cannot be empty", "path": "text" }
  ]
}
```

### 404 Response (any unknown route)

```json
{
  "success": false,
  "message": "Route not found /api/unknown-path"
}
```

### 500 / Global Error Response

```json
{
  "success": false,
  "message": "error description"
}
```

### JWT Token Shape

The JWT returned from `POST /api/auth/google` has this payload when decoded:

```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "iat": 1700000000,
  "exp": 1700604800
}
```

> All controllers read the user ID as `req.user.userId` — this is the only field to use.

---

### Bug 2 — Socket room name mismatch (chat.socket.js)

**Problem:**

```js
// joinConversation joins room named:
socket.join(conversationId); // room = "64f9a1b..."

// but sendMessage emits to:
io.to(`conversation_${conversationId}`); // room = "conversation_64f9a1b..."
```

The room names don't match, so `receive_message` is **never delivered** to clients.

**Fix:** Change `joinConversation` handler to:

```js
socket.join(`conversation_${conversationId}`);
```

---

### Bug 3 — Conversation model field typo

**Location:** `models/conversation.model.js`

```js
partticipants: [...]   // ❌ double 't'
```

Should be `participants`. Queries using `.find({ participants: userId })` in the service will not match because the stored field is `partticipants`.

---

### Bug 4 — `createMessage` uses incorrect populate syntax

**Location:** `services/message.service.js`

```js
// Wrong: calling .findById on a document instance instead of the model
return message.findById(message._id).populate("sender", "name avatar");
// ❌ message is a document, not the Model class
```

**Fix:**

```js
return Message.findById(message._id).populate("sender", "name avatar");
```

---

_Last updated: March 16, 2026_
