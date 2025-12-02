import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/AdminModels/adminRegistrationModel.js";

dotenv.config();

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("MongoDB error:", err));

const seedSuperAdmin = async () => {
  try {
    const superAdminEmail = "superadmin@example.com";
    const superAdminPassword = "SuperAdmin@123";

    // Check if superadmin already exists
    const existing = await Admin.findOne({ email: superAdminEmail });
    if (existing) {
      console.log("SuperAdmin already exists ✅");
      process.exit();
    }

    // Create superadmin with **plain password**
    const superAdmin = await Admin.create({
      fullName: "Super Admin",
      email: superAdminEmail,
      password: superAdminPassword, // Let schema pre-save hash it
      role: "superadmin"
    });

    console.log("SuperAdmin created successfully ✅", {
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role
    });

    process.exit();
  } catch (error) {
    console.error("Error creating SuperAdmin:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
