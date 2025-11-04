import express from "express";
import {
  onboardPlanner,
  getPlanner,
  updatePlanner,
  uploadProfilePhoto,
  upload,
} from "../controllers/plannerController.js";

import { authenticate, selfOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Onboard a planner (any authenticated user can onboard themselves)
router.post("/onboard", authenticate, onboardPlanner);

// Protected routes
router.get("/:id", authenticate, selfOrAdmin, getPlanner);
router.put("/:id", authenticate, selfOrAdmin, updatePlanner);
router.post(
  "/:id/upload-photo",
  authenticate,
  selfOrAdmin,
  upload.single("file"),
  uploadProfilePhoto
);

export default router;
