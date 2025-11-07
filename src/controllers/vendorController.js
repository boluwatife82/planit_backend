import { db, bucket } from "../firebase.js";
import multer from "multer";
import { z } from "zod";

//  MULTER SETUP  //
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for licenses
});

//  ZOD SCHEMAS  //
const onboardVendorSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  companyName: z.string().min(1, "Company name is required"),
  businessAddress: z.string().min(1, "Business address is required"),
  cacNumber: z.string().optional(),
  serviceCategories: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  phone: z.string().optional(),
});

const updateVendorSchema = z.object({
  companyName: z.string().optional(),
  businessAddress: z.string().optional(),
  cacNumber: z.string().optional(),
  serviceCategories: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  phone: z.string().optional(),
});

//   ONBOARD VENDOR
export const onboardVendor = async (req, res, next) => {
  try {
    const parsed = onboardVendorSchema.parse(req.body);

    const {
      userId,
      companyName,
      businessAddress,
      cacNumber,
      serviceCategories,
      yearsOfExperience,
      phone,
    } = parsed;

    // Check if user exists
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw { statusCode: 404, message: "User not found" };
    }

    const exp = yearsOfExperience ? parseInt(yearsOfExperience) : null;

    const vendorData = {
      userId,
      companyName,
      businessAddress,
      cacNumber: cacNumber || null,
      serviceCategories: serviceCategories || null,
      yearsOfExperience: exp,
      phone: phone || null,
      updatedAt: new Date().toISOString(),
    };

    // Check if vendor exists by querying userId
    const vendorQuery = await db
      .collection("vendors")
      .where("userId", "==", userId)
      .get();

    let vendorId;
    let vendor;

    if (vendorQuery.empty) {
      // Create new vendor
      vendorData.createdAt = new Date().toISOString();
      const vendorRef = await db.collection("vendors").add(vendorData);
      vendorId = vendorRef.id;
      vendor = { id: vendorId, ...vendorData };
    } else {
      // Update existing vendor
      vendorId = vendorQuery.docs[0].id;
      await db.collection("vendors").doc(vendorId).update(vendorData);
      const updatedDoc = await db.collection("vendors").doc(vendorId).get();
      vendor = { id: vendorId, ...updatedDoc.data() };
    }

    res.status(200).json({ message: "Vendor onboarded successfully", vendor });
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

//  GET VENDOR
export const getVendor = async (req, res, next) => {
  try {
    const vendorDoc = await db.collection("vendors").doc(req.params.id).get();

    if (!vendorDoc.exists) {
      throw { statusCode: 404, message: "Vendor not found" };
    }

    const vendorData = { id: vendorDoc.id, ...vendorDoc.data() };

    // Get associated user data
    if (vendorData.userId) {
      const userDoc = await db.collection("users").doc(vendorData.userId).get();
      if (userDoc.exists) {
        const { password, ...userWithoutPassword } = userDoc.data();
        vendorData.user = { id: userDoc.id, ...userWithoutPassword };
      }
    }

    res.status(200).json(vendorData);
  } catch (err) {
    next(err);
  }
};

//   UPDATE VENDOR
export const updateVendor = async (req, res, next) => {
  try {
    const parsed = updateVendorSchema.parse(req.body);
    const { id } = req.params;
    const {
      companyName,
      businessAddress,
      cacNumber,
      serviceCategories,
      yearsOfExperience,
      phone,
    } = parsed;

    // Check if vendor exists
    const vendorDoc = await db.collection("vendors").doc(id).get();
    if (!vendorDoc.exists) {
      throw { statusCode: 404, message: "Vendor not found" };
    }

    const exp = yearsOfExperience ? parseInt(yearsOfExperience) : null;
    const updateData = {
      updatedAt: new Date().toISOString(),
    };

    if (companyName) updateData.companyName = companyName;
    if (businessAddress) updateData.businessAddress = businessAddress;
    if (cacNumber !== undefined) updateData.cacNumber = cacNumber || null;
    if (serviceCategories !== undefined)
      updateData.serviceCategories = serviceCategories || null;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = exp;
    if (phone !== undefined) updateData.phone = phone || null;

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt
      throw { statusCode: 400, message: "No valid fields to update" };
    }

    // Update vendor document
    await db.collection("vendors").doc(id).update(updateData);

    const updatedDoc = await db.collection("vendors").doc(id).get();
    const vendor = { id: updatedDoc.id, ...updatedDoc.data() };

    res.status(200).json({ message: "Vendor profile updated", vendor });
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

//   UPLOAD LICENSE - FIXED VERSION
export const uploadLicense = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      throw { statusCode: 400, message: "No file uploaded" };
    }

    // Validate file type (allow PDFs and images for licenses)
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw {
        statusCode: 400,
        message:
          "Invalid file type. Only PDF, JPEG, and PNG are allowed for licenses",
      };
    }

    // Check if vendor exists
    const vendorDoc = await db.collection("vendors").doc(id).get();
    if (!vendorDoc.exists) {
      throw { statusCode: 404, message: "Vendor not found" };
    }

    let fileUrl;

    if (bucket) {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split(".").pop();
      const fileName = `vendors/${id}/licenses/${timestamp}.${fileExtension}`;
      const file = bucket.file(fileName);

      // Upload file using Promise to avoid race conditions
      await new Promise((resolve, reject) => {
        const stream = file.createWriteStream({
          metadata: {
            contentType: req.file.mimetype,
            metadata: {
              firebaseStorageDownloadTokens: timestamp,
            },
          },
          resumable: false,
        });

        stream.on("error", (err) => {
          console.error("License upload error:", err);
          reject(err);
        });

        stream.on("finish", () => {
          resolve();
        });

        stream.end(req.file.buffer);
      });

      // Make file public
      await file.makePublic();

      // Get public URL
      fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Update vendor with license URL
      await db.collection("vendors").doc(id).update({
        licenseUrl: fileUrl,
        licenseUploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const updatedDoc = await db.collection("vendors").doc(id).get();
      const vendor = { id: updatedDoc.id, ...updatedDoc.data() };

      res.status(200).json({
        message: "License uploaded successfully",
        fileUrl,
        vendor,
      });
    } else {
      // Mock upload for development
      fileUrl = `https://mock-storage.com/vendors/licenses/${req.file.originalname}`;

      await db.collection("vendors").doc(id).update({
        licenseUrl: fileUrl,
        licenseUploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const updatedDoc = await db.collection("vendors").doc(id).get();
      const vendor = { id: updatedDoc.id, ...updatedDoc.data() };

      res.status(200).json({
        message: "Mock license upload (Firebase inactive)",
        fileUrl,
        vendor,
      });
    }
  } catch (err) {
    console.error("License upload error:", err);
    next(err);
  }
};
