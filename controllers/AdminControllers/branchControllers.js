import mongoose from "mongoose";
import Branch from "../../models/AdminModels/branchModel.js"; // update path as per your structure
import bcrypt from "bcryptjs";

// ✅ Create a new Branch with Sub-Admin
const createBranch = async (req, res) => {
  try {
    const { branchName, branchAddress, subAdmin } = req.body;

    if (!branchName || !branchAddress || !subAdmin) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Hash the sub-admin password
    const hashedPassword = await bcrypt.hash(subAdmin.password, 10);
    subAdmin.password = hashedPassword;

    const newBranch = new Branch({
      branchName,
      branchAddress,
      subAdmin,
    });

    await newBranch.save();
    res.status(201).json({ message: "Branch created successfully", data: newBranch });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔄 Update Branch or Sub-Admin Details
const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid Branch ID" });

    // If updating password, hash it
    if (updates.subAdmin?.password) {
      const hashedPassword = await bcrypt.hash(updates.subAdmin.password, 10);
      updates.subAdmin.password = hashedPassword;
    }

    const updatedBranch = await Branch.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updatedBranch) return res.status(404).json({ message: "Branch not found" });

    res.status(200).json({ message: "Branch updated successfully", data: updatedBranch });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🗑️ Delete Branch
const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid Branch ID" });

    const deletedBranch = await Branch.findByIdAndDelete(id);
    if (!deletedBranch) return res.status(404).json({ message: "Branch not found" });

    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📜 Get All Branches
const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.status(200).json({ count: branches.length, data: branches });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔍 Get Branch by ID
const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid Branch ID" });

    const branch = await Branch.findById(id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    res.status(200).json({ data: branch });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ❌ Activate / Deactivate Branch or Sub-Admin
const toggleBranchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid Branch ID" });

    const branch = await Branch.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    res.status(200).json({ message: `Branch ${isActive ? "activated" : "deactivated"} successfully`, data: branch });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  createBranch,
  updateBranch,
  deleteBranch,
  getAllBranches,
  getBranchById,
  toggleBranchStatus,
};
