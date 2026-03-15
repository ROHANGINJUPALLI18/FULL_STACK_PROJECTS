// This file defines the controller function for handling Google authentication requests. It receives the token from the client, validates it, and then calls the service function to perform the actual authentication logic. The result is then sent back to the client as a JSON response.
import { googleLogin } from "../services/auth.service.js";

export const googleAuth = async (req, res, next) => {
  try {
    const requestBody =
      req.body && typeof req.body === "object" ? req.body : {};
    const token = requestBody.token || requestBody.credential;

    if (!token) {
      return res.status(400).json({
        message: "Google token is required in request body",
      });
    }

    const result = await googleLogin(token);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
