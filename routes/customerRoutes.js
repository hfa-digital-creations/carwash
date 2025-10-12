import express from "express";
import CustomerControllers from "../controllers/CustomerControllers.js";

const router = express.Router();

// Register user
router.post("/registerUser", CustomerControllers.registerUser);

// Login user
router.post("/login", CustomerControllers.loginUser);

// CRUD operations
router.get("/getAllUsers", CustomerControllers.getAllUsers);
router.get("/getUserById/:id", CustomerControllers.getUserById);
router.put("/updateUser/:id", CustomerControllers.updateUser);
router.delete("/deleteUser/:id", CustomerControllers.deleteUser);

export default router;
