// here we need to create an 1-1 or return the exsisting conversation between two users

// import the conversation model
import Conversation from "../models/conversation.model.js"

// todo 
    // 1. check if conversation already exists between the two users
    // 2. if exists return the conversation
    // 3. if not create a new conversation and return it

export const getConversation = async(userId,otherUserId)=>{
    
    try {
        // findOne :- search for a single document that matches the specified criteria. It returns the first matching document it finds or null if no match is found.
        let conversation = await Conversation.findOne({
            // $all(operator): [userId, otherUserId]  participants array must contain BOTH users
            participants: { $all: [userId, otherUserId] },
            isGroup: false
        })
        // if the conversation does not exsist , create a new conversation
        if(!conversation){
            conversation = new Conversation({
                participants:[userId,otherUserId],
                isGroup:false
            })
            await conversation.save()
        }
        return conversation;
    } catch (error) {
        throw error;
    }    
}

// get all conversations of a user
export const getUserConversations = async(userId)=>{
    try {
        const conversations = await Conversation
        .find({participants: userId})
        .populate("participants","name avatar email")
        .populate("lastMessage")
        .sort({updatedAt:-1})
        return conversations;

    }catch (error) {
        throw error;
    }   
}

// help me to understand the getUserConversations function in conversation.service.js file
// first we are finding all conversations where the user is a participant
// then we are populating the participants field with the name, avatar and email of the users
// then we are populating the lastMessage field with the message document
   