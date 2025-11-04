import prisma from "../prismaClient.js";
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

// OUR  SIGNUP  USER  //
export const signupUser = async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);

    const { firstName, lastName, email, phone, password, role } = parsed;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw { statusCode: 400, message: "User already exists" };

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res
      .status(201)
      .json({ message: "User created", user: userWithoutPassword });
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

// OUR LOGIN USER //
export const loginUser = async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { email, password } = parsed;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw { statusCode: 404, message: "User not found" };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw { statusCode: 401, message: "Invalid credentials" };

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user;
    res
      .status(200)
      .json({ message: "Login successful", user: userWithoutPassword, token });
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

//  GET  OUR USER PROFILE //
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { planner: true, vendor: true },
    });

    if (!user) throw { statusCode: 404, message: "User not found" };
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
};

//  UPDATE USER PROFILE //
export const updateUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (req.user.id !== userId && req.user.role !== "ADMIN") {
      throw { statusCode: 403, message: "Forbidden: Access denied" };
    }

    const parsed = updateSchema.parse(req.body);
    const { firstName, lastName, phone, password } = parsed;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    if (Object.keys(updateData).length === 0) {
      throw { statusCode: 400, message: "No valid fields to update" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res
      .status(200)
      .json({ message: "User profile updated", user: userWithoutPassword });
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
