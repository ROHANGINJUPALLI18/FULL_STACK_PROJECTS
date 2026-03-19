import express from "express"
import { googleAuth } from "../controllers/auth.controller.js"
import { authLimiter } from "../middleware/rateLimit.middleware.js"
const router = express.Router()

// router.post will do the work of creating a route for POST requests to /google and will call the googleAuth controller function when that route is hit.
// the controller function will handle the logic for authenticating the user with Google and returning the appropriate response.
router.post("/google", authLimiter, googleAuth)

export default router