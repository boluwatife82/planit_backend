import express from "express";
import {
  signupUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";

import { authenticate, selfOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC
router.post("/signup", signupUser);
router.post("/login", loginUser);

// PROTECTED
router.get("/:id", authenticate, selfOrAdmin, getUserProfile);
router.put("/:id", authenticate, selfOrAdmin, updateUserProfile);

export default router;
