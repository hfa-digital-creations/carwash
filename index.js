import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import Routes from "./routes/index.js";
import bcrypt from "bcryptjs";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

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

// ✅ Swagger UI route
// ✅ Swagger UI route (correct order)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// ✅ Optional: raw swagger.json route
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocument);
});

// ✅ Main app routes
app.use(Routes);

// ✅ Connect MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
