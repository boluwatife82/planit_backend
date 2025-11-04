// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

// ------------------- AUTHENTICATE JWT ------------------- //
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user; // attach user to request for later use
    next();
  } catch (err) {
    console.error("Auth Error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ------------------- ROLE-BASED ACCESS CONTROL ------------------- //
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }
    next();
  };
};

// ------------------- SELF OR ADMIN ------------------- //
export const selfOrAdmin = (req, res, next) => {
  const requestedId = parseInt(req.params.id);
  if (req.user.id !== requestedId && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden: Access denied" });
  }
  next();
};
