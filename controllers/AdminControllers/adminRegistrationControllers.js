import Admin from "../../models/AdminModels/adminRegistrationModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// -------------------- CREATE / REGISTER ADMIN --------------------
const registerAdmin = async (req, res) => {
  try {
    const { adminId, fullName, email, password } = req.body;

    if (!adminId || !fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ adminId }, { email }] });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin ID or Email already exists" });
    }

    const admin = await Admin.create({ adminId, fullName, email, password });
    res.status(201).json({
      message: "Admin registered successfully ✅",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- LOGIN ADMIN --------------------
const loginAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({ message: "Admin ID and password are required" });
    }

    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, adminId: admin.adminId, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Admin logged in successfully ✅",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      },
      token
    });
  } catch (error) {
    console.error("Error logging in admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET ALL ADMINS --------------------
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ message: "Admins fetched successfully ✅", admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET ADMIN BY ID --------------------
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin fetched successfully ✅", admin });
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- UPDATE ADMIN --------------------
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, fullName, email, password } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update fields if provided
    if (adminId) admin.adminId = adminId;
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    // Return all admin details except password
    const { _id, role, createdAt, updatedAt } = admin;
    res.status(200).json({
      message: "Admin updated successfully ✅",
      admin: {
        id: _id,
        adminId: admin.adminId,
        fullName: admin.fullName,
        email: admin.email,
        role,
        createdAt,
        updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// -------------------- DELETE ADMIN --------------------
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAdmin = await Admin.findByIdAndDelete(id);
    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin deleted successfully ✅" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
