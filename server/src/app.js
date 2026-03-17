import express from "express";
import cors from "cors";

// the below are middlewares that we will use in our app, we will import them from the middleware folder
import { logger } from "./middleware/logger.middleware.js";
import { errorMiddleware as errorHandler } from "./middleware/error.middleware.js";
import { notFOund as notFound } from "./middleware/notFound.middleware.js";

// the below imports are for the routes that we will use in our app, we will import them from the routes folder
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// request logger middleware
app.use(logger);

// the express.json() middleware is used to parse the req.body as JSON
app.use(express.json({ limit: "10kb" }))

// enable CORS for all routes and origins
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// test route to check if the server is running
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// 404 not found middleware
app.use(notFound);

// global error handling middleware
app.use(errorHandler);

// export the app for use in server.js
export default app;
