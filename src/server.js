import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

// ✅ Import Firebase to initialize it early
import "./firebase.js";

import plannerRoutes from "./routes/plannerRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// MIDDLEWARE  //
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ❌ REMOVED: No longer need local uploads folder since using Firebase Storage
// app.use("/uploads", express.static("uploads"));

//  ROUTES  //
app.use("/planners", plannerRoutes);
app.use("/vendors", vendorRoutes);
app.use("/users", userRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "Planit Backend is running 🚀",
    database: "Firebase Firestore",
    storage: "Firebase Storage",
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

//  START SERVER  //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: Firebase Firestore`);
  console.log(`☁️  Storage: Firebase Storage`);
});
