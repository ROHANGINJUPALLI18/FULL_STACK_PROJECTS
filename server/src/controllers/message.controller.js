// this file is responsible for handling the conversation related operations
// like creating a new message, getting messages of a conversation, updating message status etc.

import {
  createMessage,
  getMessages,
  validateParticipant,
} from "../services/message.service.js";

// create an express route handler for creating a new message

export const sendMessage = async (req, res) => {
  const io = req.app.get("io");
  const senderId = req.user?.userId || req.user?._id;
  const { conversationId, content, text } = req.body;

  const messageText = content ?? text;

  if (!senderId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!conversationId || !messageText) {
    return res.status(400).json({
      success: false,
      message: "conversationId and message text are required",
    });
  }

  try {
    const isParticipant = await validateParticipant(conversationId, senderId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }
    const message = await createMessage({
      conversationId,
      sender: senderId,
      text: messageText,
    });

    if (io) {
      io.to(conversationId).emit("receive_message", message);
    }

    res.status(201).json(message);
  } catch (error) {
    if (error.message === "Conversation not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "User not part of this conversation") {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid conversationId" });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create message",
      details: error.message,
    });
  }
};

export const fetchMessages = async (req, res) => {
  const userId = req.user?.userId || req.user?._id;
  const { conversationId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const isParticipant = await validateParticipant(conversationId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this conversation",
      });
    }
    const messages = await getMessages(conversationId, page, limit);
    res.status(200).json(messages);
  } catch (error) {
    if (error.message === "Conversation not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "User not part of this conversation") {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid conversationId" });
    }
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      details: error.message,
    });
  }
};
