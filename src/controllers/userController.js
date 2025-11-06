import { db } from "../firebase.js"; // ✅ FIREBASE - NOT PRISMA
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

// ZOD SCHEMAS  //
const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"], "Role must be USER or ADMIN"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
});

// OUR SIGNUP USER - FIREBASE VERSION ✅
export const signupUser = async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);

    const { firstName, lastName, email, phone, password, role } = parsed;

    // ✅ FIREBASE: Check if user exists by querying email
    const existingUserQuery = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (!existingUserQuery.empty) {
      throw { statusCode: 400, message: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FIREBASE: Create new user document
    const userData = {
      firstName,
      lastName,
      email,
      phone: phone || null,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userRef = await db.collection("users").add(userData);
    const userDoc = await userRef.get();

    const { password: _, ...userWithoutPassword } = userDoc.data();
    res.status(201).json({
      message: "User created",
      user: { id: userDoc.id, ...userWithoutPassword },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next({
        statusCode: 400,
        message: "Validation error",
        details: err.errors,
      });
    }
    next(err);
  }
};

// OUR LOGIN USER - FIREBASE VERSION ✅
export const loginUser = async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    // ✅ FIREBASE: Find user by email
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userQuery.empty) {
      throw { statusCode: 404, message: "User not found" };
    }

    const userDoc = userQuery.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw { statusCode: 401, message: "Invalid credentials" };
    }

    // Make sure JWT_SECRET exists
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in your .env file");
    }

    // When logging in a user
    const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
      expiresIn: "7d",
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next({
        statusCode: 400,
        message: "Validation error",
        details: err.errors,
      });
    }
    next(err);
  }
};

// GET OUR USER PROFILE - FIREBASE VERSION ✅
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id; // ✅ String ID, not parseInt

    // ✅ FIREBASE: Get user document
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw { statusCode: 404, message: "User not found" };
    }

    const userData = { id: userDoc.id, ...userDoc.data() };

    // ✅ FIREBASE: Manually get associated planner data
    const plannerQuery = await db
      .collection("planners")
      .where("userId", "==", userId)
      .get();

    if (!plannerQuery.empty) {
      const plannerDoc = plannerQuery.docs[0];
      userData.planner = { id: plannerDoc.id, ...plannerDoc.data() };
    }

    // ✅ FIREBASE: Manually get associated vendor data
    const vendorQuery = await db
      .collection("vendors")
      .where("userId", "==", userId)
      .get();

    if (!vendorQuery.empty) {
      const vendorDoc = vendorQuery.docs[0];
      userData.vendor = { id: vendorDoc.id, ...vendorDoc.data() };
    }

    const { password: _, ...userWithoutPassword } = userData;
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
};

// UPDATE USER PROFILE - FIREBASE VERSION ✅
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id; // ✅ String ID, not parseInt

    if (req.user.id !== userId && req.user.role !== "ADMIN") {
      throw { statusCode: 403, message: "Forbidden: Access denied" };
    }

    const parsed = updateSchema.parse(req.body);
    const { firstName, lastName, phone, password } = parsed;

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt
      throw { statusCode: 400, message: "No valid fields to update" };
    }

    // ✅ FIREBASE: Check if user exists
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw { statusCode: 404, message: "User not found" };
    }

    // ✅ FIREBASE: Update user document
    await db.collection("users").doc(userId).update(updateData);

    const updatedDoc = await db.collection("users").doc(userId).get();
    const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() };

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      message: "User profile updated",
      user: userWithoutPassword,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next({
        statusCode: 400,
        message: "Validation error",
        details: err.errors,
      });
    }
    next(err);
  }
};
