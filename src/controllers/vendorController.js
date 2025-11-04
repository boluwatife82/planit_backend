import prisma from "../prismaClient.js";
import multer from "multer";
import { bucket } from "../firebase.js";
import { z } from "zod";

//  MULTER SETUP  //
export const upload = multer({ storage: multer.memoryStorage() });

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

//   ONBOARD VENDOR    //
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

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) throw { statusCode: 404, message: "User not found" };

    const exp = yearsOfExperience ? parseInt(yearsOfExperience) : null;

    const vendor = await prisma.vendor.upsert({
      where: { userId: parseInt(userId) },
      update: {
        companyName,
        businessAddress,
        cacNumber: cacNumber || null,
        serviceCategories: serviceCategories || null,
        yearsOfExperience: exp,
        phone: phone || null,
      },
      create: {
        userId: parseInt(userId),
        companyName,
        businessAddress,
        cacNumber: cacNumber || null,
        serviceCategories: serviceCategories || null,
        yearsOfExperience: exp,
        phone: phone || null,
      },
    });

    res.status(200).json({ message: "Vendor onboarded successfully", vendor });
  } catch (err) {
    if (err instanceof z.ZodError)
      return next({
        statusCode: 400,
        message: "Validation error",
        details: err.errors,
      });
    next(err);
  }
};

//  GET VENDOR -   //
export const getVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: true },
    });

    if (!vendor) throw { statusCode: 404, message: "Vendor not found" };

    res.status(200).json(vendor);
  } catch (err) {
    next(err);
  }
};

//   UPDATE VENDOR   //
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

    const exp = yearsOfExperience ? parseInt(yearsOfExperience) : null;
    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (businessAddress) updateData.businessAddress = businessAddress;
    if (cacNumber) updateData.cacNumber = cacNumber;
    if (serviceCategories) updateData.serviceCategories = serviceCategories;
    if (yearsOfExperience) updateData.yearsOfExperience = exp;
    if (phone) updateData.phone = phone;

    if (Object.keys(updateData).length === 0)
      throw { statusCode: 400, message: "No valid fields to update" };

    const vendor = await prisma.vendor.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({ message: "Vendor profile updated", vendor });
  } catch (err) {
    if (err instanceof z.ZodError)
      return next({
        statusCode: 400,
        message: "Validation error",
        details: err.errors,
      });
    next(err);
  }
};

//   UPLOAD LICENSE    //
export const uploadLicense = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) throw { statusCode: 400, message: "No file uploaded" };

    let fileUrl;

    if (bucket) {
      const fileName = `vendors/licenses/${Date.now()}-${
        req.file.originalname
      }`;
      const file = bucket.file(fileName);

      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      stream.on("error", (err) => next(err));

      stream.on("finish", async () => {
        await file.makePublic();
        fileUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        const vendor = await prisma.vendor.update({
          where: { id: parseInt(id) },
          data: { licenseUrl: fileUrl },
        });

        res
          .status(200)
          .json({ message: "License uploaded successfully", fileUrl, vendor });
      });

      stream.end(req.file.buffer);
    } else {
      fileUrl = `https://mock-storage.com/vendors/${req.file.originalname}`;
      const vendor = await prisma.vendor.update({
        where: { id: parseInt(id) },
        data: { licenseUrl: fileUrl },
      });

      res.status(200).json({
        message: "Mock license upload (Firebase inactive)",
        fileUrl,
        vendor,
      });
    }
  } catch (err) {
    next(err);
  }
};
