import admin from "firebase-admin";

let bucket = null;

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  bucket = admin.storage().bucket();
  console.log("✅ Firebase initialized");
} catch (err) {
  console.warn("⚠️ Firebase not initialized:", err.message);
}

export { bucket };
