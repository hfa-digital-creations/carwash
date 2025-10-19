import express from "express";
import serviceController from "../controllers/serviceController.js";
import { uploadProductImage } from "../middlewares/multerConfig.js"; // adjust path

const router = express.Router();

// ✅ Create Service with image upload
router.post(
  "/createService",
  uploadProductImage.single("itemImage"), // Multer middleware for single image
  serviceController.createService
);

// ✅ Get all services
router.get("/getAllServices", serviceController.getAllServices);

// ✅ Get service by ID
router.get("/serviceById/:serviceId", serviceController.getServiceById);

// ✅ Get all services by repair technician
router.get(
  "/getAlltechnician/:repairTechnicianId",
  serviceController.getAllServicesByRepairTechnicianId
);

// ✅ Update service (with optional new image)
router.put(
  "/updateService/:serviceId",
  uploadProductImage.single("itemImage"),
  serviceController.updateService
);

// ✅ Delete service
router.delete("/deleteService/:serviceId", serviceController.deleteService);

export default router;
