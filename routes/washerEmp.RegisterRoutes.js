import express from "express";
import washerEmployeeControllers from "../controllers/washerEmpRegistrationController.js";

const router = express.Router();

// Create a new washer employee
router.post("/createWasherEmployee", washerEmployeeControllers.createWasherEmployee);

// Get all washer employees
router.get("/getAllWasherEmployees", washerEmployeeControllers.getAllWasherEmployees);

// Get a washer employee by ID
router.get("/getWasherEmployeeById/:id", washerEmployeeControllers.getWasherEmployeeById);

// Update a washer employee by ID
router.put("/updateWasherEmployee/:id", washerEmployeeControllers.updateWasherEmployee);

// Delete a washer employee by ID
router.delete("/deleteWasherEmployee/:id", washerEmployeeControllers.deleteWasherEmployee);

export default router;
