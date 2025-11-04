import express from "express";
import {
  onboardVendor,
  getVendor,
  updateVendor,
  uploadLicense,
  upload,
} from "../controllers/vendorController.js";

import { authenticate, selfOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Onboard a vendor
router.post("/onboard", authenticate, onboardVendor);

// Protected routes
router.get("/:id", authenticate, selfOrAdmin, getVendor);
router.put("/:id", authenticate, selfOrAdmin, updateVendor);
router.post(
  "/:id/upload-license",
  authenticate,
  selfOrAdmin,
  upload.single("file"),
  uploadLicense
);

export default router;
