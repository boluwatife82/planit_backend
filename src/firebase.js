import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

// ✅ Ensure all required env variables exist
const requiredEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_STORAGE_BUCKET",
  "JWT_SECRET", // also check your JWT secret
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

// ✅ Service account config
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

let db = null;
let bucket = null;

try {
  // ✅ Initialize Firebase
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  // ✅ Firestore DB
  db = admin.firestore();

  // ✅ Storage bucket
  bucket = getStorage().bucket();

  console.log("✅ Firebase initialized successfully");
  console.log("✅ Firestore DB connected");
  console.log("✅ Storage bucket ready");
} catch (err) {
  console.error("❌ Firebase initialization failed:", err);
  process.exit(1); // Stop the app if Firebase can't initialize
}

// ✅ Export for use in routes
export { db, bucket };
export default admin;
