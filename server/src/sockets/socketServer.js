import { Server } from "socket.io";
import { registerChatHandlers } from "./chat.socket.js";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    registerChatHandlers(io, socket);
  });

  return io;
};
