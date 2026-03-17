// this file will handle all the socket connections and events related to chat functionality

import {
  validateParticipant,
  createMessage,
} from "../services/message.service.js";

export const registerChatHandlers = (io, socket) => {
  // this tells when the user is connected to the socket server
  console.log("User connected to chat socket: ", socket.id);

  // join the user room
  // the below line will make the user join a  room with their userId, so that we can emit messages to that specific user when they receive a new message
  socket.on("join", (userId) => {
    // validate the userId
    if (!userId) {
      socket.emit("error", { message: "Invalid user ID" });
      return;
    }
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // join conversation room
  // the below line will make the user join a room with the conversationId, so that we can emit messages to all participants of that conversation when a new message is sent in that conversation
  socket.on("joinConversation", (conversationId) => {
    // validate the conversationId
    if (!conversationId) {
      socket.emit("error", { message: "Invalid conversation ID" });
      return;
    }
    socket.join(conversationId);
    console.log(`User joined conversation room: ${conversationId}`);
  });

  // handle sending a message
  // the below line will listen for the "sendMessage" event from the client, and it will create a new message in the database and emit the new message to all participants of the conversation
  socket.on(
    "sendMessage",
    async ({ conversationId, senderId, text, attachments }, callback) => {
      try {
        // validate if the sender is a participant of the conversation
        await validateParticipant(conversationId, senderId);
        // create a new message
        const message = await createMessage({
          conversationId,
          sender: senderId,
          text,
          attachments,
        });
        // emit the new message to all participants of the conversation by the conversationId
        io.to(conversationId).emit("receive_message", message);
        if (typeof callback === "function") {
          callback({
            status: "ok",
            message: message,
          });
        }
      } catch (error) {
        console.error("Error sending message: ", error);
        socket.emit("error", { message: error.message });
        if (typeof callback === "function") {
          callback({
            status: "error",
            message: error.message,
          });
        }
      }
    },
  );

  // this tells when the user is disconnected from the socket server
  socket.on("disconnect", () => {
    console.log("User disconnected from chat socket: ", socket.id);
  });

  // Reconnection logic can be implemented here if needed
  socket.on("connect_error", (error) => {
    console.error("Socket connection error: ", error);
  });
};
