import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// the below line will create a new instance of the OAuth2Client class, which is used to verify the Google token received from the client. The client ID is passed as an argument to the constructor, which is required for verifying the token.
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const { email, name, picture, sub } = payload;
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "User")}&background=random`;

  // findOne method is used to find the user in the database.
  let user = await User.findOne({ email });
  // if user not found then create a new user in the database with the information received from the google token.
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture || fallbackAvatar,
      googleId: sub,
    });
  }
  // we need to save the user in the database and then generate a JWT token for the user, which will be used for authentication in subsequent requests. The JWT token will contain the user's ID and will be signed with a secret key.
  await user.save();

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  return { user, token: jwtToken };
};
