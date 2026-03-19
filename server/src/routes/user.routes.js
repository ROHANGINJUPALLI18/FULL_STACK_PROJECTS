import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { findUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protect, findUsers);

export default router;
