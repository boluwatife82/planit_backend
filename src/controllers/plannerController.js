import { db, bucket } from "../firebase.js";
import multer from "multer";
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

    // Check if user exists
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw { statusCode: 404, message: "User not found" };
    }

    // Create/update planner document
    const plannerData = {
      userId,
      companyName,
      businessAddress,
      cacNumber: cacNumber || null,
      socialMediaLinks: socialMediaLinks || null,
      portfolioWebsite: portfolioWebsite || null,
      updatedAt: new Date().toISOString(),
    };

    // Check if planner exists by querying userId
    const plannerQuery = await db
      .collection("planners")
      .where("userId", "==", userId)
      .get();

    let plannerId;
    let planner;

    if (plannerQuery.empty) {
      // Create new planner
      plannerData.createdAt = new Date().toISOString();
      const plannerRef = await db.collection("planners").add(plannerData);
      plannerId = plannerRef.id;
      planner = { id: plannerId, ...plannerData };
    } else {
      // Update existing planner
      plannerId = plannerQuery.docs[0].id;
      await db.collection("planners").doc(plannerId).update(plannerData);
      const updatedDoc = await db.collection("planners").doc(plannerId).get();
      planner = { id: plannerId, ...updatedDoc.data() };
    }

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

    // Check if planner exists
    const plannerDoc = await db.collection("planners").doc(id).get();
    if (!plannerDoc.exists) {
      throw { statusCode: 404, message: "Planner not found" };
    }

    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (parsed.companyName) updateData.companyName = parsed.companyName;
    if (parsed.businessAddress)
      updateData.businessAddress = parsed.businessAddress;
    if (parsed.cacNumber !== undefined)
      updateData.cacNumber = parsed.cacNumber || null;
    if (parsed.socialMediaLinks !== undefined)
      updateData.socialMediaLinks = parsed.socialMediaLinks || null;
    if (parsed.portfolioWebsite !== undefined)
      updateData.portfolioWebsite = parsed.portfolioWebsite || null;

    await db.collection("planners").doc(id).update(updateData);

    const updatedDoc = await db.collection("planners").doc(id).get();
    const planner = { id: updatedDoc.id, ...updatedDoc.data() };

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
    const plannerDoc = await db.collection("planners").doc(req.params.id).get();

    if (!plannerDoc.exists) {
      throw { statusCode: 404, message: "Planner not found" };
    }

    const plannerData = { id: plannerDoc.id, ...plannerDoc.data() };

    // Get associated user data
    if (plannerData.userId) {
      const userDoc = await db
        .collection("users")
        .doc(plannerData.userId)
        .get();
      if (userDoc.exists) {
        plannerData.user = { id: userDoc.id, ...userDoc.data() };
      }
    }

    res.status(200).json(plannerData);
  } catch (err) {
    next(err);
  }
};

// UPLOAD PROFILE PHOTO
export const uploadProfilePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) throw { statusCode: 400, message: "No file uploaded" };

    // Check if planner exists
    const plannerDoc = await db.collection("planners").doc(id).get();
    if (!plannerDoc.exists) {
      throw { statusCode: 404, message: "Planner not found" };
    }

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

        await db.collection("planners").doc(id).update({
          profilePhoto: fileUrl,
          updatedAt: new Date().toISOString(),
        });

        const updatedDoc = await db.collection("planners").doc(id).get();
        const planner = { id: updatedDoc.id, ...updatedDoc.data() };

        res
          .status(200)
          .json({ message: "Profile photo uploaded", fileUrl, planner });
      });

      stream.end(req.file.buffer);
    } else {
      fileUrl = `https://mock-storage.com/planners/${req.file.originalname}`;

      await db.collection("planners").doc(id).update({
        profilePhoto: fileUrl,
        updatedAt: new Date().toISOString(),
      });

      const updatedDoc = await db.collection("planners").doc(id).get();
      const planner = { id: updatedDoc.id, ...updatedDoc.data() };

      res
        .status(200)
        .json({ message: "Mock upload (Firebase inactive)", fileUrl, planner });
    }
  } catch (err) {
    next(err);
  }
};
