# Chat Application — Complete End-to-End Documentation

This document explains the Chat Application from frontend user action to backend response, including:

- Key features
- Backend routes and API contracts
- Socket.IO events and payloads
- End-to-end workflow (login, conversation, messages)
- Exact files responsible for each stage
- `req`, `res`, `body`, `params`, and `query` examples
- How messages are fetched from DB and shown in UI

---

## 1) High-Level Architecture

## Stack

- **Frontend:** React + Vite + Axios + Socket.IO client
- **Backend:** Express + Mongoose + JWT + Google OAuth + Socket.IO
- **Database:** MongoDB

## Runtime Flow

1. User logs in with Google on frontend.
2. Frontend sends Google credential to backend `/api/auth/google`.
3. Backend verifies token with Google, creates/fetches user in MongoDB, returns JWT.
4. Frontend stores JWT and user in `localStorage`.
5. Frontend loads conversations and messages via REST APIs.
6. Frontend joins Socket.IO user room + active conversation room.
7. Sending message uses REST (`POST /api/messages`), backend saves to MongoDB and emits `receive_message` to conversation room.
8. Frontend receives socket event and updates chat list/message list.

---

## 2) Key Features

- Google Sign-In authentication
- JWT-protected APIs
- Search users by name/email
- Start or reuse 1:1 conversations
- Load conversation list sorted by latest update
- Fetch paginated messages per conversation
- Real-time message broadcasting with Socket.IO
- Conversation preview updates (`lastMessage`) on new message

---

## 3) Project Structure and File Responsibilities

## Root

- `client/` → React frontend
- `server/` → Express API + Socket.IO + MongoDB

## Frontend important files

- `client/src/main.jsx`
  - Wraps app with `GoogleOAuthProvider` using `VITE_GOOGLE_CLIENT_ID`.

- `client/src/App.jsx`
  - Auth gate based on `localStorage.token`.
  - Switches between `LoginPage` and `ChatPage`.

- `client/src/pages/LoginPage.jsx`
  - Renders animated login component.

- `client/src/components/ui/animated-characters-login-page.jsx`
  - Google login callback handler.
  - Sends `POST ${VITE_API_URL}/api/auth/google` with `{ credential }`.
  - Stores `token` and `user` in `localStorage`.

- `client/src/pages/ChatPage.jsx`
  - Renders `Chat_App`.

- `client/src/components/Chat_App.jsx`
  - Core chat UI and business logic.
  - Fetches conversations: `GET /api/conversations`.
  - Fetches messages: `GET /api/messages/:conversationId?page=1&limit=50`.
  - Searches users: `GET /api/users/search?q=...&limit=10`.
  - Starts conversation: `POST /api/conversations`.
  - Sends message: `POST /api/messages`.
  - Initializes socket connection and handles `receive_message`.

- `client/src/services/api.js`
  - Axios instance with `baseURL = VITE_API_URL`.

- `client/src/lib/utils.js`
  - UI utility (`cn`) for class merging.

## Backend important files

- `server/src/server.js`
  - Loads env, connects DB, creates HTTP server, attaches Socket.IO.
  - Stores io instance in app context: `app.set("io", io)`.

- `server/src/app.js`
  - Express app setup and middleware order.
  - Mounts all REST routes.

- `server/src/config/db.js`
  - MongoDB connection via mongoose.

- `server/src/middleware/logger.middleware.js`
  - Logs method/url/ip for each request.

- `server/src/middleware/auth.middleware.js`
  - Verifies JWT from `Authorization: Bearer <token>`.
  - Sets `req.user` with decoded token payload.

- `server/src/middleware/rateLimit.middleware.js`
  - Rate limit for auth route.

- `server/src/middleware/notFound.middleware.js`
  - 404 JSON response.

- `server/src/middleware/error.middleware.js`
  - Global error response formatter.

- `server/src/routes/auth.routes.js`
  - `POST /api/auth/google`.

- `server/src/routes/user.routes.js`
  - `GET /api/users/search`.

- `server/src/routes/conversation.routes.js`
  - `POST /api/conversations`, `GET /api/conversations`.

- `server/src/routes/message.routes.js`
  - `POST /api/messages`, `GET /api/messages/:conversationId`.

- `server/src/controllers/*.js`
  - Handles req parsing and response sending.

- `server/src/services/*.js`
  - Business logic + database operations.

- `server/src/models/user.model.js`
- `server/src/models/conversation.model.js`
- `server/src/models/message.model.js`
  - MongoDB schemas.

- `server/src/sockets/socketServer.js`
  - Socket.IO server creation.

- `server/src/sockets/chat.socket.js`
  - Event handlers: join rooms, send message, broadcast.

- `server/src/validators/message.validator.js`
- `server/src/validators/validation.middleware.js`
  - Message payload validation and error formatting.

## Present but currently empty (not used in runtime)

- `server/src/routes/chat.routes.js`
- `server/src/controllers/chat.controller.js`
- `server/src/services/chat.service.js`
- `server/src/config/redis.js`
- `server/src/utils/helpers.js`
- `server/src/utils/logger.js`

---

## 4) Environment Variables

## Backend (`server/.env`)

```env
PORT=5000
MONGO_URI=...
GOOGLE_CLIENT_ID=...
JWT_SECRET=...
JWT_EXPIRES=7d
CLIENT_URL=http://localhost:5173
```

## Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=...
```

---

## 5) Data Models (MongoDB)

## User

```js
{
  name: String,          // required
  email: String,         // required, unique
  avatar: String,        // required
  googleId: String,      // required, unique
  createdAt: Date,
  updatedAt: Date
}
```

## Conversation

```js
{
  participants: [ObjectId<User>],
  isGroup: Boolean,      // default false
  name: String,          // optional (for group)
  lastMessage: ObjectId<Message>,
  createdAt: Date,
  updatedAt: Date
}
```

## Message

```js
{
  conversationId: ObjectId<Conversation>, // required
  sender: ObjectId<User>,                 // required
  text: String,
  attachments: [String],
  status: "sent" | "delivered" | "read", // default sent
  createdAt: Date,
  updatedAt: Date
}
```

---

## 6) API Endpoints (Complete)

Base URL (local): `http://localhost:5000`

## 6.1 Health

### GET `/`

- **Auth:** No
- **Request body:** none
- **Response 200**

```json
{ "message": "Server is running" }
```

---

## 6.2 Auth

### POST `/api/auth/google`

- **Auth:** No
- **Rate limited:** yes (`authLimiter`)
- **Request body accepted:**

```json
{ "token": "GOOGLE_ID_TOKEN" }
```

or

```json
{ "credential": "GOOGLE_ID_TOKEN" }
```

- **Controller reads:**
  - `req.body.token || req.body.credential`

- **Response 200**

```json
{
  "user": {
    "_id": "USER_ID",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://...",
    "googleId": "GOOGLE_SUB",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "JWT_TOKEN"
}
```

- **Error 400**

```json
{
  "success": false,
  "message": "Google token is required in request body"
}
```

- **Error 429**

```json
{ "message": "Too many requests, please try again later" }
```

---

## 6.3 Users

### GET `/api/users/search?q=<query>&limit=<n>`

- **Auth:** Yes (`protect`)
- **Headers:**

```http
Authorization: Bearer <JWT_TOKEN>
```

- **Query params:**
  - `q` (string, search text)
  - `limit` (number, default 10)

- **Controller reads:**
  - `req.query.q`
  - `req.query.limit`
  - `req.user.userId` (from JWT)

- **Response 200**

```json
[
  {
    "_id": "USER_ID",
    "name": "Jane",
    "email": "jane@example.com",
    "avatar": "https://..."
  }
]
```

- **Behavior note:**
  - Returns `[]` if query is empty after trim.
  - Excludes current logged-in user.

---

## 6.4 Conversations

### POST `/api/conversations`

- **Auth:** Yes
- **Headers:** `Authorization: Bearer <JWT_TOKEN>`
- **Request body**

```json
{ "otherUserId": "OTHER_USER_ID" }
```

- **Controller reads:**
  - `req.user.userId`
  - `req.body.otherUserId`

- **Service behavior:**
  - Find 1:1 conversation where participants contain both users.
  - If not found, create a new one.

- **Response 200**

```json
{
  "_id": "CONVERSATION_ID",
  "participants": ["USER_A", "USER_B"],
  "isGroup": false,
  "lastMessage": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET `/api/conversations`

- **Auth:** Yes
- **Controller reads:**
  - `req.user.userId`

- **Service behavior:**
  - `find({ participants: userId })`
  - `populate("participants", "name avatar email")`
  - `populate("lastMessage")`
  - `sort({ updatedAt: -1 })`

- **Response 200**

```json
[
  {
    "_id": "CONVERSATION_ID",
    "participants": [
      { "_id": "...", "name": "Jane", "email": "...", "avatar": "..." }
    ],
    "isGroup": false,
    "lastMessage": {
      "_id": "MESSAGE_ID",
      "text": "Hi",
      "sender": "USER_ID",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "updatedAt": "...",
    "createdAt": "..."
  }
]
```

---

## 6.5 Messages

### POST `/api/messages`

- **Auth:** Yes
- **Validation:**
  - `conversationId` required
  - text from `body.text` OR `body.content`
  - text non-empty, max length 2000

- **Request body example**

```json
{
  "conversationId": "CONVERSATION_ID",
  "text": "Hello from REST"
}
```

- **Controller reads:**
  - `req.user.userId` as sender
  - `req.body.conversationId`
  - `req.body.content ?? req.body.text`

- **Service behavior:**
  - Verify sender belongs to conversation (`validateParticipant`)
  - Create Message doc
  - Update conversation `lastMessage`
  - Populate sender (`name avatar`)

- **Socket side effect:**
  - Emits `receive_message` to room `conversationId`.

- **Response 201**

```json
{
  "_id": "MESSAGE_ID",
  "conversationId": "CONVERSATION_ID",
  "sender": {
    "_id": "SENDER_ID",
    "name": "John",
    "avatar": "https://..."
  },
  "text": "Hello from REST",
  "attachments": [],
  "status": "sent",
  "createdAt": "...",
  "updatedAt": "..."
}
```

- **Error 400 (validator)**

```json
{
  "success": false,
  "errors": [
    {
      "msg": "conversationId is required",
      "path": "conversationId",
      "location": "body"
    }
  ]
}
```

- **Error 403**

```json
{
  "success": false,
  "message": "You are not a participant in this conversation"
}
```

- **Error 404**

```json
{ "success": false, "message": "Conversation not found" }
```

### GET `/api/messages/:conversationId?page=1&limit=20`

- **Auth:** Yes
- **Path params:** `conversationId`
- **Query params:** `page`, `limit`

- **Controller reads:**
  - `req.params.conversationId`
  - `req.query.page`, `req.query.limit`
  - `req.user.userId`

- **Service behavior:**
  - Validate membership in conversation
  - Query messages by conversation
  - Sort descending by `createdAt`
  - Apply pagination via `skip` + `limit`
  - Populate sender (`name avatar`)

- **Response 200** (latest first from backend)

```json
[
  {
    "_id": "M3",
    "text": "Latest message",
    "sender": { "_id": "U1", "name": "John", "avatar": "..." },
    "createdAt": "2026-03-19T10:10:00.000Z"
  },
  {
    "_id": "M2",
    "text": "Older message",
    "sender": { "_id": "U2", "name": "Jane", "avatar": "..." },
    "createdAt": "2026-03-19T10:09:00.000Z"
  }
]
```

---

## 7) Socket.IO Contract

Server setup in `socketServer.js`:

- CORS origin: `CLIENT_URL` or `http://localhost:5173`
- On connection, registers handlers from `chat.socket.js`

## Events

### Client → Server: `join`

- **Payload:** `userId` (string)
- **Purpose:** Join personal room with user id.

```js
socket.emit("join", currentUser._id);
```

### Client → Server: `joinConversation`

- **Payload:** `conversationId` (string)
- **Purpose:** Join room for active conversation.

```js
socket.emit("joinConversation", selectedConversationId);
```

### Client → Server: `sendMessage`

- **Payload:**

```json
{
  "conversationId": "CONVERSATION_ID",
  "senderId": "USER_ID",
  "text": "Hello from socket",
  "attachments": []
}
```

- **Server action:** validate participant → save message → emit `receive_message`
- **Optional callback response:**

```json
{ "status": "ok", "message": { "_id": "...", "text": "..." } }
```

or

```json
{ "status": "error", "message": "User not part of this conversation" }
```

### Server → Client: `receive_message`

- **Payload:** newly created message object (populated sender).
- **Used by frontend to append message and refresh conversation preview.**

### Server → Client: `error`

- **Payload:** `{ "message": "..." }`

---

## 8) End-to-End Workflows (User Action to Response)

## 8.1 Login Flow (Google)

1. User clicks Google Sign-In button in login page component.
2. Google returns `credential` JWT to frontend callback.
3. Frontend sends:

```http
POST /api/auth/google
Content-Type: application/json

{ "credential": "GOOGLE_ID_TOKEN" }
```

4. Backend controller extracts `credential` and calls `googleLogin` service.
5. Service verifies token with Google API, upserts user in MongoDB, signs JWT.
6. Backend returns `{ user, token }`.
7. Frontend stores token/user in `localStorage` and dispatches `auth-changed`.
8. `App.jsx` observes auth change and renders chat page.

## 8.2 Load Conversations Flow

1. `Chat_App.jsx` mounts.
2. Calls `GET /api/conversations` with `Authorization: Bearer <token>`.
3. Backend validates JWT (`protect`) and reads `req.user.userId`.
4. Service fetches user conversations (populate participants + lastMessage).
5. Frontend normalizes each conversation into UI shape:
   - other user name/avatar
   - last message preview
   - relative time
6. First conversation is auto-selected.

## 8.3 Start New Conversation Flow

1. User types in search input.
2. Frontend debounces 350ms and requests `/api/users/search`.
3. User clicks one result.
4. Frontend sends `POST /api/conversations { otherUserId }`.
5. Backend returns existing/new conversation.
6. Frontend refreshes list and sets selected conversation.

## 8.4 Fetch Messages Flow (Important: DB to UI)

### Backend path

`GET /api/messages/:conversationId` → `fetchMessages` controller → `validateParticipant` service → `getMessages` service.

- `getMessages` query:
  - filters by `conversationId`
  - populates `sender` (`name avatar`)
  - sorts by `createdAt: -1` (newest first)
  - applies `skip` and `limit`

### Frontend path

`Chat_App.jsx` `fetchMessages(conversationId)`:

1. Calls API with `page=1&limit=50`.
2. Receives array newest-first from backend.
3. Reverses array: `const latestMessages = [...res.data].reverse()`
4. Stores into state `messages`.
5. UI maps `messages` and renders bubbles; current user messages right-aligned.

This is exactly how backend-fetched messages appear in UI in chronological order.

## 8.5 Send Message Flow (REST + Socket)

1. User enters text and clicks send.
2. Frontend sends:

```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "CONVERSATION_ID",
  "text": "Hi there"
}
```

3. Backend validates body + JWT + participant membership.
4. Backend creates message doc and updates conversation `lastMessage`.
5. Backend emits socket event `receive_message` to conversation room.
6. Backend returns `201` message in HTTP response.
7. Frontend appends HTTP response message if not duplicate.
8. Frontend socket listener also receives `receive_message`; duplicate-check prevents double insertion.
9. Frontend refreshes conversations to keep sidebar preview/time updated.

---

## 9) Request/Response Object Breakdown (`req`, `res`)

## Example A — `POST /api/messages`

### Incoming `req` shape (simplified)

```js
req = {
  headers: {
    authorization: "Bearer <JWT>"
  },
  user: {
    userId: "SENDER_ID",
    iat: 1710000000,
    exp: 1710600000
  },
  body: {
    conversationId: "CONVERSATION_ID",
    text: "Hello"
  },
  app: {
    get: ("io") => SocketIOServer
  }
}
```

### Outgoing `res` success

```js
res.status(201).json(messageObject);
```

### Outgoing `res` failure examples

```js
res.status(401).json({ success: false, message: "Unauthorized" });
res
  .status(403)
  .json({
    success: false,
    message: "You are not a participant in this conversation",
  });
res.status(400).json({ success: false, message: "Invalid conversationId" });
```

## Example B — `GET /api/messages/:conversationId?page=1&limit=20`

### Incoming `req` shape

```js
req = {
  params: { conversationId: "CONVERSATION_ID" },
  query: { page: "1", limit: "20" },
  user: { userId: "USER_ID" },
};
```

### Outgoing `res` success

```js
res.status(200).json(messagesArray);
```

---

## 10) Current Behavior Notes / Important Details

- Auth middleware expects header starting with `Bearer`.
- JWT payload includes `userId` (not full user object).
- Message validator accepts `text` or `content`.
- Message fetch endpoint returns newest-first; UI reverses for oldest-first display.
- Real-time socket is used for receiving updates, but primary send in UI currently uses REST endpoint.
- Socket send event exists on server (`sendMessage`) and can be used by future frontend enhancement.

---

## 11) Quick API Test Examples (cURL)

## Google login

```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"GOOGLE_ID_TOKEN"}'
```

## Search users

```bash
curl "http://localhost:5000/api/users/search?q=john&limit=10" \
  -H "Authorization: Bearer JWT_TOKEN"
```

## Start conversation

```bash
curl -X POST http://localhost:5000/api/conversations \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId":"OTHER_USER_ID"}'
```

## Send message

```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"CONVERSATION_ID","text":"Hello"}'
```

## Fetch messages

```bash
curl "http://localhost:5000/api/messages/CONVERSATION_ID?page=1&limit=20" \
  -H "Authorization: Bearer JWT_TOKEN"
```

---

## 12) Summary

This application combines REST + Socket.IO in a clear pattern:

- REST for deterministic CRUD-like operations (auth, list, fetch, send)
- Socket for real-time push updates (`receive_message`)
- MongoDB stores users, conversations, and messages
- Frontend maps backend responses into UI state and keeps conversation/message views synchronized

If needed, this document can be extended with sequence diagrams, Postman collection, and an OpenAPI spec.
