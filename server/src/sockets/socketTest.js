import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("join", "USER_ID");

  socket.emit("joinConversation", "CONVERSATION_ID");

  socket.emit("sendMessage", {
    conversationId: "CONVERSATION_ID",
    senderId: "USER_ID",
    text: "Hello from socket",
  });
});

socket.on("receive_message", (message) => {
  console.log("Message received:", message);
});
