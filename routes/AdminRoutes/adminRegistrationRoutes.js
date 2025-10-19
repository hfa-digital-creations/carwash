import express from "express";
import adminController from "../../controllers/AdminControllers/adminRegistrationControllers.js";
// import { protectAdmin } from "../middleware/authMiddleware.js"; // optional JWT auth middleware

const router = express.Router();

// -------------------- ADMIN ROUTES --------------------

// Register a new admin
router.post("/register", adminController.registerAdmin);

// Admin login
router.post("/login", adminController.loginAdmin);

// Get all admins (protected route)
router.get("/getAllAdmins",  adminController.getAllAdmins);

// Get admin by ID (protected route)
router.get("/getAdminById/:id", adminController.getAdminById);

// Update admin by ID (protected route)
router.put("/updateAdmin/:id", adminController.updateAdmin);

// Delete admin by ID (protected route)
router.delete("/deleteAdmin/:id", adminController.deleteAdmin);

export default router;
