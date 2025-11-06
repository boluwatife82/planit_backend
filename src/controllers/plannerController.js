import prisma from "../prismaClient.js";
import multer from "multer";
import { bucket } from "../firebase.js";
import { z } from "zod";

// MULTER SETUP //
export const upload = multer({ storage: multer.memoryStorage() });

// ZOD SCHEMAS

const plannerOnboardSchema = z.object({
  userId: z.string().nonempty("userId is required"),
  companyName: z.string().nonempty("companyName is required"),
  businessAddress: z.string().nonempty("businessAddress is required"),
  socialMediaLinks: z.string().optional(),
  portfolioWebsite: z.string().url("Invalid URL").optional(),
  cacNumber: z.string().optional(),
});

const plannerUpdateSchema = z.object({
  companyName: z.string().optional(),
  businessAddress: z.string().optional(),
  cacNumber: z.string().optional(),
  socialMediaLinks: z.string().optional(),
  portfolioWebsite: z.string().url("Invalid URL").optional(),
});

// ONBOARD PLANNER

export const onboardPlanner = async (req, res, next) => {
  try {
    const parsed = plannerOnboardSchema.parse(req.body);

    const {
      userId,
      companyName,
      businessAddress,
      socialMediaLinks,
      portfolioWebsite,
      cacNumber,
    } = parsed;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) throw { statusCode: 404, message: "User not found" };

    const planner = await prisma.planner.upsert({
      where: { userId: parseInt(userId) },
      update: {
        companyName,
        businessAddress,
        cacNumber: cacNumber || null,
        socialMediaLinks: socialMediaLinks || null,
        portfolioWebsite: portfolioWebsite || null,
      },
      create: {
        userId: parseInt(userId),
        companyName,
        businessAddress,
        cacNumber: cacNumber || null,
        socialMediaLinks: socialMediaLinks || null,
        portfolioWebsite: portfolioWebsite || null,
      },
    });

    res.status(200).json({
      message: "Planner onboarded successfully",
      planner,
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

// UPDATE PLANNER

export const updatePlanner = async (req, res, next) => {
  try {
    const parsed = plannerUpdateSchema.parse(req.body);
    const { id } = req.params;

    const planner = await prisma.planner.update({
      where: { id: parseInt(id) },
      data: {
        companyName: parsed.companyName,
        businessAddress: parsed.businessAddress,
        cacNumber: parsed.cacNumber || null,
        socialMediaLinks: parsed.socialMediaLinks || null,
        portfolioWebsite: parsed.portfolioWebsite || null,
      },
    });

    res.status(200).json({ message: "Planner profile updated", planner });
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

// GET PLANNER

export const getPlanner = async (req, res, next) => {
  try {
    const planner = await prisma.planner.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: true },
    });

    if (!planner) throw { statusCode: 404, message: "Planner not found" };

    res.status(200).json(planner);
  } catch (err) {
    next(err);
  }
};

// UPLOAD PROFILE PHOTO

export const uploadProfilePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) throw { statusCode: 400, message: "No file uploaded" };

    let fileUrl;

    if (bucket) {
      const fileName = `planners/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(fileName);

      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      stream.on("error", (err) => next(err));

      stream.on("finish", async () => {
        await file.makePublic();
        fileUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        const planner = await prisma.planner.update({
          where: { id: parseInt(id) },
          data: { profilePhoto: fileUrl },
        });

        res
          .status(200)
          .json({ message: "Profile photo uploaded", fileUrl, planner });
      });

      stream.end(req.file.buffer);
    } else {
      fileUrl = `https://mock-storage.com/planners/${req.file.originalname}`;

      const planner = await prisma.planner.update({
        where: { id: parseInt(id) },
        data: { profilePhoto: fileUrl },
      });

      res
        .status(200)
        .json({ message: "Mock upload (Firebase inactive)", fileUrl, planner });
    }
  } catch (err) {
    next(err);
  }
};
