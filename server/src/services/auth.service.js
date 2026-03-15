import { OAuth2Client } from "google-auth-library"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

// the below line will create a new instance of the OAuth2Client class, which is used to verify the Google token received from the client. The client ID is passed as an argument to the constructor, which is required for verifying the token.
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)



export const googleLogin = async (token) => {

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  })

  const payload = ticket.getPayload()

  const { email, name, picture, sub } = payload

  let user = await User.findOne({ email })

  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture,
      googleId: sub
    })
  }

  const jwtToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  )

  return { user, token: jwtToken }
}