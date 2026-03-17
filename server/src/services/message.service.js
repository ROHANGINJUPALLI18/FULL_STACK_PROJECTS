import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

// this file will contain the business logic for messages
// 1. create a new message
// 2. get messages of a conversation
// 3. update message status

// the below function will validate if the user is a participant of the conversation before allowing them to send or read messages in that conversation
export const validateParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participantId) => participantId.toString() === userId.toString(),
  );

  if (!isParticipant) {
    throw new Error("User not part of this conversation");
  }

  return true;
};

// create a new message
export const createMessage = async ({
  conversationId,
  sender,
  text,
  attachments = [],
}) => {
  // todo
  // 1. create a new message document
  // 2. update the lastMessage field of the conversation
  try {
    const message = new Message({
      conversationId,
      sender,
      text,
      attachments,
    });
    await message.save();
    // update the lastMessage field of the conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });
    // the below line will populate the sender field of the message with the name and avatar of the sender, so that we can send the complete message object to the clients without needing to make another query to get the sender details
    return Message.findById(message._id).populate("sender", "name avatar");
  } catch (error) {
    throw error;
  }
};

// get messages of a conversation with pagination i.e 20 messages per page
export const getMessages = async (conversationId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const messages = await Message.find({ conversationId })
    .populate("sender", "name avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return messages;
};
