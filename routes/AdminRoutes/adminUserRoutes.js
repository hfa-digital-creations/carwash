import express from "express";
import adminControllers from "../../controllers/AdminControllers/adminUserController.js";

const router = express.Router();

// ✅ Activate / Deactivate Customer
router.put("/:userId/active", adminControllers.toggleUserActive);

// ✅ Activate / Deactivate Technician
router.put("/technician/:technicianId/active", adminControllers.toggleTechnicianActive);

// ✅ Activate / Deactivate Product Seller
router.put("/seller/:sellerId/active", adminControllers.toggleProductSellerActive);

// Washer / Delivery personnel
router.put("/employee/:employeeId/active", adminControllers.toggleWasherDeliveryActive);

export default router;
