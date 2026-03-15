// this file is responsible for handling the conversation related operations
// like creating a new message, getting messages of a conversation, updating message status etc.

import { createMessage, getMessages, validateParticipant } from "../services/message.service.js"

// create an express route handler for creating a new message

export const sendMessage  = async (req, res) => {
    const senderId = req.user._id; // the authenticated user's id will be available in the request object after authentication middleware
    const {
            conversationId,
            content 
        } = req.body;
    try {
        const isParticipant = await validateParticipant(conversationId, senderId);
        if (!isParticipant) {
            return res.status(403).json({ error: "You are not a participant in this conversation" });
        }
        const message = await createMessage(
            {   conversationId, 
                sender: senderId,
                text: content 
            }
        );
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: "Failed to create message" });
    }

}


export const fetchMessages = async (req, res) => {
    const userId = req.user._id; // the authenticated user's id will be available in the request object after authentication middleware
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    try {
        const isParticipant = await validateParticipant(conversationId, userId);    
        if (!isParticipant) {
            return res.status(403).json({ error: "You are not a participant in this conversation" });
        }
        const messages = await getMessages(conversationId, page, limit);
        res.status(200).json(messages);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to get messages" });
    }

}


