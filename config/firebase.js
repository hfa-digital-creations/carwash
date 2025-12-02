// config/firebase.js
import admin from "firebase-admin";
import fs from "fs";

let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) {
    console.log("✅ Firebase already initialized");
    return admin;
  }

  try {
    // Option 1: Load from file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (fs.existsSync(filePath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        admin.initializeApp({ 
          credential: admin.credential.cert(serviceAccount) 
        });
        console.log("✅ Firebase admin initialized (from file)");
        firebaseInitialized = true;
        return admin;
      }
    }

    // Option 2: Load from environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ 
        credential: admin.credential.cert(serviceAccount) 
      });
      console.log("✅ Firebase admin initialized (from env JSON)");
      firebaseInitialized = true;
      return admin;
    }

    // Option 3: Load from individual environment variables
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      console.log("🔧 Using individual Firebase env vars...");
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle escaped newlines in private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log("✅ Firebase admin initialized (from individual env vars)");
      firebaseInitialized = true;
      return admin;
    }

    // Option 4: Default initialization (for GCP environments)
    console.warn("⚠️ No Firebase credentials found, using default/ADC");
    admin.initializeApp();
    console.log("✅ Firebase admin initialized (default/ADC)");
    firebaseInitialized = true;
    return admin;

  } catch (err) {
    console.error("❌ Firebase initialization error:", err.message);
    throw new Error(`Firebase initialization failed: ${err.message}`);
  }
};

// Don't auto-initialize here - let server.js control when to initialize
export default admin;