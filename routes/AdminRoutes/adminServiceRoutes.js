import express from "express";
import ServiceController from "../../controllers/AdminControllers/adminServiceControllers.js";
import { verifyAdminAccessToken, superAdminOnly } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

// ==================== ADMIN SERVICE MANAGEMENT ====================

// Create new service (Basic Car Wash, Premium Bike Wash, etc.)
router.post("/services/create", verifyAdminAccessToken, superAdminOnly, ServiceController.createService);

// Get all services (with filters)
router.get("/services/all", verifyAdminAccessToken, superAdminOnly, ServiceController.getAllServices);

// Get services by type (Car Wash / Bike Wash) - Public
router.get("/services/type/:serviceType", ServiceController.getServicesByType);

// Get service by ID
router.get("/services/:id", ServiceController.getServiceById);

// Update service
router.put("/services/:id/update", verifyAdminAccessToken, superAdminOnly, ServiceController.updateService);

// Toggle service status (Active/Inactive)
router.put("/services/:id/toggle-status", verifyAdminAccessToken, superAdminOnly, ServiceController.toggleServiceStatus);

// Delete service
router.delete("/services/:id/delete", verifyAdminAccessToken, superAdminOnly, ServiceController.deleteService);

export default router;