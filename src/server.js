import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import plannerRoutes from "./routes/plannerRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// MIDDLEWARE  //
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

//  ROUTES  //
app.use("/planners", plannerRoutes);
app.use("/vendors", vendorRoutes);
app.use("/users", userRoutes);
app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Planit Backend is running ✅");
});

//  START SERVER  //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
