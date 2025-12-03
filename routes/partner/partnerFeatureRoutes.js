import express from "express";
import PartnerFeatureController from "../../controllers/partner/partnerFeatureControllers.js";
import { verifyAccessToken, checkRole } from "../../middlewares/partnerAuthMiddleware.js";

const router = express.Router();

// ==================== PROFILE MANAGEMENT (All Partners) ====================

// Get my profile
router.get("/profile", verifyAccessToken, PartnerFeatureController.getPartnerProfile);

// Update profile (common fields)
router.put("/profile/update", verifyAccessToken, PartnerFeatureController.updatePartnerProfile);

// Update payout details
router.put("/payout/update", verifyAccessToken, PartnerFeatureController.updatePayoutDetails);

// ==================== WASHING PERSONNEL / DELIVERY PERSON ====================

// Update vehicle details
router.put(
  "/vehicle/update",
  verifyAccessToken,
  checkRole("Washing Personnel", "Delivery Person"),
  PartnerFeatureController.updateVehicleDetails
);

// Toggle availability (Available/Unavailable)
router.put(
  "/availability",
  verifyAccessToken,
  checkRole("Washing Personnel", "Delivery Person"),
  PartnerFeatureController.updateAvailability
);

// ==================== REPAIR SERVICE TECHNICIAN ====================

// Get my services
router.get(
  "/services",
  verifyAccessToken,
  checkRole("Repair Service Technician"),
  PartnerFeatureController.getMyServices
);

// Add new service
router.post(
  "/services/add",
  verifyAccessToken,
  checkRole("Repair Service Technician"),
  PartnerFeatureController.addService
);

// Update service
router.put(
  "/services/:serviceId/update",
  verifyAccessToken,
  checkRole("Repair Service Technician"),
  PartnerFeatureController.updateService
);

// Delete service
router.delete(
  "/services/:serviceId/delete",
  verifyAccessToken,
  checkRole("Repair Service Technician"),
  PartnerFeatureController.deleteService
);

// Update shop details (Technician & Seller)
router.put(
  "/shop/update",
  verifyAccessToken,
  checkRole("Repair Service Technician", "Product Seller"),
  PartnerFeatureController.updateShopDetails
);

// ==================== PRODUCT SELLER ====================

// Get my products
router.get(
  "/products",
  verifyAccessToken,
  checkRole("Product Seller"),
  PartnerFeatureController.getMyProducts
);

// Add new product
router.post(
  "/products/add",
  verifyAccessToken,
  checkRole("Product Seller"),
  PartnerFeatureController.addProduct
);

// Update product
router.put(
  "/products/:productId/update",
  verifyAccessToken,
  checkRole("Product Seller"),
  PartnerFeatureController.updateProduct
);

// Delete product
router.delete(
  "/products/:productId/delete",
  verifyAccessToken,
  checkRole("Product Seller"),
  PartnerFeatureController.deleteProduct
);

// ==================== EARNINGS (All Partners) ====================

// Get earnings summary
router.get("/earnings/summary", verifyAccessToken, PartnerFeatureController.getEarningsSummary);

// Get transaction history
router.get("/earnings/transactions", verifyAccessToken, PartnerFeatureController.getTransactionHistory);

// ==================== NOTES ====================
/*
PARTNER FEATURE ROUTES:

All Partners:
- GET /api/partner-features/profile
- PUT /api/partner-features/profile/update
- PUT /api/partner-features/payout/update
- GET /api/partner-features/earnings/summary
- GET /api/partner-features/earnings/transactions

Washing Personnel / Delivery Person:
- PUT /api/partner-features/vehicle/update
- PUT /api/partner-features/availability

Repair Service Technician:
- GET /api/partner-features/services
- POST /api/partner-features/services/add
- PUT /api/partner-features/services/:serviceId/update
- DELETE /api/partner-features/services/:serviceId/delete
- PUT /api/partner-features/shop/update

Product Seller:
- GET /api/partner-features/products
- POST /api/partner-features/products/add
- PUT /api/partner-features/products/:productId/update
- DELETE /api/partner-features/products/:productId/delete
- PUT /api/partner-features/shop/update
*/

export default router;