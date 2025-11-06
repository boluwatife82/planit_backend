import jwt from "jsonwebtoken";
import { db } from "../firebase.js"; // ✅ FIREBASE - NOT PRISMA

// AUTHENTICATE JWT - FIREBASE VERSION ✅
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    // ✅ FIREBASE: Get user from Firestore (no parseInt needed)
    const userDoc = await db.collection("users").doc(decoded.userId).get();

    if (!userDoc.exists) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user data to request (includes the document ID)
    req.user = { id: userDoc.id, ...userDoc.data() };
    next();
  } catch (err) {
    console.error("Auth Error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ROLE-BASED ACCESS CONTROL - NO CHANGES NEEDED ✅
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    next();
  };
};

// SELF OR ADMIN - FIREBASE VERSION ✅
export const selfOrAdmin = (req, res, next) => {
  const requestedId = req.params.id; // ✅ No parseInt - Firebase uses string IDs

  if (req.user.id !== requestedId && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Access denied" });
  }
  next();
};
