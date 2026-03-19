import express from "express";
import {protect} from "../middleware/auth.middleware.js";
import {startConversation,listConversations} from "../controllers/conversation.controller.js";

const router = express.Router();

// it will be converted as /api/startConversation and it will start a new conversation between the logged in user and the user whose id is sent in the request body
router.post("/", protect, startConversation);

// the below will be converted as /api/list-conversations and it will return all the conversations of the logged in user
router.get("/", protect, listConversations);

export default router;