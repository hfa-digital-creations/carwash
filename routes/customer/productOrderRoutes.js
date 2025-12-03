import express from "express";
import ProductOrderController from "../../controllers/customer/productOrderControllers.js";
import { verifyAccessToken } from "../../middlewares/authMiddleware.js"; // Customer
import { verifyAccessToken as verifyPartnerToken, checkRole } from "../../middlewares/partnerAuthMiddleware.js"; // Partner
import { verifyAdminAccessToken } from "../../middlewares/adminMiddleware.js"; // Admin

const router = express.Router();

// ==================== CUSTOMER ROUTES ====================

// Create order (Customer must be logged in)
router.post("/create", verifyAccessToken, ProductOrderController.createProductOrder);

// Get my orders (Customer)
router.get("/my-orders", verifyAccessToken, ProductOrderController.getMyOrders);

// Get order by ID
router.get("/:id", ProductOrderController.getOrderById);

// Cancel order (Customer)
router.put("/:id/cancel", verifyAccessToken, ProductOrderController.cancelOrder);

// ==================== PRODUCT SELLER ROUTES ====================

// Get seller's orders (Product Seller only)
router.get(
  "/seller/orders", 
  verifyPartnerToken, 
  checkRole("Product Seller"),
  ProductOrderController.getSellerOrders
);

// Confirm order (Seller confirms order)
router.put(
  "/:id/confirm", 
  verifyPartnerToken, 
  checkRole("Product Seller"),
  ProductOrderController.confirmOrder
);

// Update order status (Seller updates to Processing, Shipped)
router.put(
  "/:id/update-status",
  verifyPartnerToken,
  checkRole("Product Seller"),
  ProductOrderController.updateOrderStatus
);

// ==================== DELIVERY PARTNER ROUTES ====================

// Get delivery partner's orders (Delivery Person only)
router.get(
  "/delivery/orders",
  verifyPartnerToken,
  checkRole("Delivery Person"),
  ProductOrderController.getDeliveryPartnerOrders
);

// Accept delivery (Delivery partner accepts)
router.put(
  "/:id/accept-delivery",
  verifyPartnerToken,
  checkRole("Delivery Person"),
  ProductOrderController.acceptDelivery
);

// Decline delivery (Delivery partner declines)
router.put(
  "/:id/decline-delivery",
  verifyPartnerToken,
  checkRole("Delivery Person"),
  ProductOrderController.declineDelivery
);

// ==================== ADMIN ROUTES ====================

// Get all orders (Admin only)
router.get("/admin/all", verifyAdminAccessToken, ProductOrderController.getAllOrders);

// Manually assign delivery partner (Admin only)
router.post("/admin/assign-delivery", verifyAdminAccessToken, ProductOrderController.assignDeliveryPartner);

// Update order status (Admin can update any status)
router.put("/admin/:id/update-status", verifyAdminAccessToken, ProductOrderController.updateOrderStatus);

// ==================== NOTES ====================
/*
SHOPPING ORDER FLOW:

1. Customer creates order → Status: "Pending"
   POST /api/order/create

2. Seller confirms order
   PUT /api/order/:id/confirm → Status: "Confirmed"

3. Seller updates to Processing
   PUT /api/order/:id/update-status (body: { status: "Processing" })

4. Seller updates to Shipped
   PUT /api/order/:id/update-status (body: { status: "Shipped" })

5. Admin assigns delivery partner
   POST /api/order/admin/assign-delivery → Status: "Out for Delivery"

6. Delivery partner accepts/declines
   PUT /api/order/:id/accept-delivery
   PUT /api/order/:id/decline-delivery

7. Delivery partner delivers
   PUT /api/order/:id/update-status (body: { status: "Delivered" })
   → Creates transactions for seller & delivery partner

8. Customer rates & reviews
   POST /api/review/create
*/

export default router;