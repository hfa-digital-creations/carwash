import express from "express";
import CustomerControllers from "../controllers/CustomerControllers.js";

const router = express.Router();

// Register & Login
router.post("/registerUser", CustomerControllers.registerUser);
router.post("/login", CustomerControllers.loginUser);

// CRUD operations
router.get("/getAllUsers", CustomerControllers.getAllUsers);
router.get("/getUserById/:id", CustomerControllers.getUserById);
router.put("/updateProfile/:id", CustomerControllers.updateProfile);
router.delete("/deleteUser/:id", CustomerControllers.deleteUser);

// -------------------- FORGOT & RESET PASSWORD --------------------
router.post("/forgotPassword", CustomerControllers.forgotPassword);
router.put("/resetPassword/:token", CustomerControllers.resetPassword);

export default router;
