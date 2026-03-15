// this file is responsible for handling the conversation related operations
// i.e. creating a conversation, getting all conversations of a user, etc.
// when the user sends a request to create a conversation, this controller will handle the request and call the appropriate service to create the conversation in the database

import {getConversation,getUserConversations} from '../services/conversation.service.js';

// create a conversation between two users
// after createing the conversation we need to return the conversation to the client

export const startConversation = async (req, res, next) =>{
    try {
        // the user id will be available in the request object after authentication middleware
        // the req object will have a user property which contains the authenticated user's information
        console.log("authenticated user details , after the authentication middleware",req);
        const userId = req.user._id; 
        // the other user id will be sent in the request body
        const {otherUserId} = req.body;
        const conversation = await getConversation(userId,otherUserId);
        res.status(200).json(conversation);
    } catch (error) {
        next(error);
    }
}

export const listConversations = async (req, res, next) =>{
    try {
        const userId = req.user._id;
        const conversations = await getUserConversations(userId);
        res.status(200).json(conversations);
    } catch (error) {
        next(error);
    }   
}

