import { body } from "express-validator";

export const sendMessageValidator = [
  body("conversationId").notEmpty().withMessage("conversationId is required"),

  body().custom((_, { req }) => {
    const messageText = req.body?.text ?? req.body?.content;
    if (!messageText || String(messageText).trim().length === 0) {
      throw new Error("Message text cannot be empty");
    }
    if (String(messageText).length > 2000) {
      throw new Error("Message too long");
    }
    return true;
  }),
];
