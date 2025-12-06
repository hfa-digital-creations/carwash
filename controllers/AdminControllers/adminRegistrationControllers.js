// ============================================
// FILE: controllers/AdminControllers/adminRegistrationControllers.js
// ============================================
import Admin from "../../models/AdminModels/adminRegistrationModel.js";
import bcrypt from "bcryptjs";
import { generateAndSaveTokens } from "../../middlewares/adminMiddleware.js";

// Register Admin (SuperAdmin Only)
export const registerAdmin = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let adminRole = "admin";
    if (role === "superadmin" && req.admin.role === "superadmin") {
      adminRole = "superadmin";
    } else if (role === "superadmin") {
      return res.status(403).json({ message: "Only SuperAdmin can create SuperAdmin" });
    }

    const admin = await Admin.create({ 
      fullName, 
      email: email.toLowerCase(), 
      password, 
      role: adminRole 
    });

    res.status(201).json({ 
      message: "Admin created", 
      admin: { 
        id: admin._id, 
        fullName: admin.fullName, 
        email: admin.email, 
        role: admin.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    if (!admin.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const { accessToken, refreshToken } = await generateAndSaveTokens(admin._id);
    
    res.status(200).json({ 
      message: "Login successful", 
      admin: { 
        id: admin._id, 
        fullName: admin.fullName, 
        email: admin.email, 
        role: admin.role 
      }, 
      accessToken, 
      refreshToken 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all Admins
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password -refreshToken");
    res.status(200).json({ 
      message: "Admins fetched", 
      count: admins.length, 
      admins 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get Admin by ID
export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password -refreshToken");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin fetched", admin });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.userId).select("-password -refreshToken");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Profile fetched", admin });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Admin
export const updateAdmin = async (req, res) => {
  try {
    const { fullName, email, password, isActive } = req.body;
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (email && email.toLowerCase() !== admin.email) {
      const exists = await Admin.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }
      admin.email = email.toLowerCase();
    }

    if (fullName) admin.fullName = fullName;
    if (password) admin.password = await bcrypt.hash(password, 10);
    if (typeof isActive === "boolean") admin.isActive = isActive;

    await admin.save();
    res.status(200).json({ message: "Admin updated", admin });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete Admin
export const deleteAdmin = async (req, res) => {
  try {
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: "Cannot delete self" });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ message: "Admin deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};