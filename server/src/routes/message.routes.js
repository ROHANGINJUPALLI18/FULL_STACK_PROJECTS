import {
  fetchMessages,
  sendMessage,
} from "../controllers/message.controller.js";
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { sendMessageValidator } from "../validators/message.validator.js";
import { validate } from "../validators/validation.middleware.js";

const router = express.Router();

// it will be converted as /api/send-message and it will send a message from the logged in user to the user whose id is sent in the request body
router.post("/", protect, sendMessageValidator, validate, sendMessage);

// the below will be converted as /api/get-messages and it will return all the messages of the conversation whose id is sent in the request body
router.get("/:conversationId", protect, fetchMessages);

export default router;
