import express from "express";
import washerEmployeeControllers from "../controllers/washerEmpRegistrationController.js";
import { uploadEmployeeDocs } from "../middlewares/multerConfig.js";

const router = express.Router();

// Create a new washer employee with file uploads
router.post(
  "/createWasherEmployee",
  uploadEmployeeDocs.fields([
    { name: "registrationCertificate", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
  ]),
  washerEmployeeControllers.createWasherEmployee
);

// Update a washer employee with file uploads
router.put(
  "/updateWasherEmployee/:id",
  uploadEmployeeDocs.fields([
    { name: "registrationCertificate", maxCount: 1 },
    { name: "drivingLicense", maxCount: 1 },
    { name: "aadhaarCard", maxCount: 1 },
  ]),
  washerEmployeeControllers.updateWasherEmployee
);

// Other routes
router.get("/getAllWasherEmployees", washerEmployeeControllers.getAllWasherEmployees);
router.get("/getWasherEmployeeById/:id", washerEmployeeControllers.getWasherEmployeeById);
router.delete("/deleteWasherEmployee/:id", washerEmployeeControllers.deleteWasherEmployee);

export default router;
