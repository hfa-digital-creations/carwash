import express from "express";
import branchController from "../../controllers/AdminControllers/branchControllers.js";

const router = express.Router();

// ✅ Create a new Branch with Sub-Admin
router.post("/createBranch", branchController.createBranch);

// 🔄 Update Branch or Sub-Admin details
router.put("/updateBranch/:id", branchController.updateBranch);

// 🗑️ Delete Branch
router.delete("/deleteBranch/:id", branchController.deleteBranch);

// 📜 Get all Branches
router.get("/getAllBranches", branchController.getAllBranches);

// 🔍 Get Branch by ID
router.get("/getBranchById/:id", branchController.getBranchById);

// ❌ Activate / Deactivate Branch or Sub-Admin
router.put("/toggleBranchStatus/:id", branchController.toggleBranchStatus);

export default router;
