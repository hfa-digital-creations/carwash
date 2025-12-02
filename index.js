import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import Routes from "./routes/index.js";
import { initializeFirebase } from "./config/firebase.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ✅ Dynamic Swagger loader
let swaggerDocument = JSON.parse(
  fs.readFileSync(new URL("./swagger.json", import.meta.url), "utf-8")
);

// Watch swagger.json for changes
fs.watchFile(new URL("./swagger.json", import.meta.url), (curr, prev) => {
  console.log("📘 swagger.json changed, reloading...");
  try {
    swaggerDocument = JSON.parse(
      fs.readFileSync(new URL("./swagger.json", import.meta.url), "utf-8")
    );
  } catch (err) {
    console.error("❌ Failed to reload swagger.json:", err.message);
  }
});

// ✅ Swagger UI routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocument);
});

// ✅ Initialize Firebase (optional)
initializeFirebase();

// ✅ Main app routes
app.use(Routes);


// Debug: Check Twilio credentials
console.log("🔧 Environment Variables:");
console.log("  TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID || "❌ MISSING");
console.log("  TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "✅ Present" : "❌ MISSING");
console.log("  TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER || "❌ MISSING");

// Debug check
console.log("🔧 Environment Variables:");
console.log("  FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID || "❌ MISSING");
console.log("  FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Present" : "❌ MISSING");
console.log("  FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✅ Present" : "❌ MISSING");

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ✅ Start server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});