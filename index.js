import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { initializeFirebase } from "./config/firebase.js";

// Customer
import customerRouters from "./routes/customer/customerRoutes.js";
import bookingRoutes from "./routes/customer/bookingRoutes.js";
import productRoutes from "./routes/customer/productOrderRoutes.js";
import serviceBookingRoutes from "./routes/customer/serviceBookingRoutes.js";

// Partner
import partnerRouters from "./routes/partner/partnerRoutes.js";
import partnerFeatureRouters from "./routes/partner/partnerFeatureRoutes.js";


// Admin
import adminRegistration from "./routes/AdminRoutes/adminRegistrationRoutes.js";
import otp from "./routes/AdminRoutes/passwordResetRoutes.js";
import adminService from "./routes/AdminRoutes/adminServiceRoutes.js";

dotenv.config();
const app = express();


// Middlewares
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ==============================
// 🔥 ENVIRONMENT DEBUG LOGS
// ==============================

console.log("============================================");
console.log("🔧 LOADED ENVIRONMENT VARIABLES");
console.log("============================================");

console.log("Twilio:");
console.log("  TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "✅ Present" : "❌ MISSING");
console.log("  TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "✅ Present" : "❌ MISSING");
console.log("  TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER ? "✅ Present" : "❌ MISSING");

console.log("--------------------------------------------");

console.log("Firebase:");
console.log("  FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID || "❌ MISSING");
console.log("  FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Present" : "❌ MISSING");
console.log("  FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✅ Present" : "❌ MISSING");

console.log("============================================");


// ==============================
// ⚡ Load Swagger
// ==============================
let swaggerDocument = JSON.parse(
  fs.readFileSync(new URL("./swagger.json", import.meta.url), "utf-8")
);

// Auto reload swagger.json
fs.watchFile(new URL("./swagger.json", import.meta.url), () => {
  try {
    console.log("📘 swagger.json updated — reloading...");
    swaggerDocument = JSON.parse(
      fs.readFileSync(new URL("./swagger.json", import.meta.url), "utf-8")
    );
  } catch (err) {
    console.error("❌ Swagger reload error:", err.message);
  }
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocument);
});

// Initialize Firebase
initializeFirebase();

// Default Root Route
app.get("/", (req, res) => {
  res.send("Backend working fine");
});

// Customer
app.use("/customer", customerRouters);
app.use("/booking",bookingRoutes);
app.use("/order",productRoutes);
app.use("/service",serviceBookingRoutes);


// Partner
app.use("/partner", partnerRouters);
app.use("/partner-features", partnerFeatureRouters);


// Admin
app.use("/admin", adminRegistration);
app.use("/admin", otp);
app.use("/admin", adminService);

// MongoDB connect
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// Start Server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs → http://localhost:${PORT}/api-docs`);
});
