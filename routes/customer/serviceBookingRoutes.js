import express from "express";
import ServiceBookingController from "../../controllers/customer/serviceBookingControllers.js";
import { verifyAccessToken } from "../../middlewares/authMiddleware.js"; // Customer
import { verifyAccessToken as verifyPartnerToken, checkRole } from "../../middlewares/partnerAuthMiddleware.js"; // Partner
import { verifyAdminAccessToken } from "../../middlewares/adminMiddleware.js"; // Admin

const router = express.Router();

// ==================== CUSTOMER ROUTES ====================

// Request service (Customer must be logged in)
router.post("/request", verifyAccessToken, ServiceBookingController.requestService);

// Get my service requests (Customer)
router.get("/my-requests", verifyAccessToken, ServiceBookingController.getMyServiceRequests);

// Get service by ID
router.get("/:id", ServiceBookingController.getServiceById);

// Cancel service (Customer)
router.put("/:id/cancel", verifyAccessToken, ServiceBookingController.cancelService);

// ==================== REPAIR TECHNICIAN ROUTES ====================

// Get technician's service requests (Repair Service Technician only)
router.get(
  "/technician/requests",
  verifyPartnerToken,
  checkRole("Repair Service Technician"),
  ServiceBookingController.getTechnicianServiceRequests
);

// Accept service request (Technician)
router.put(
  "/:id/accept",
  verifyPartnerToken,
  checkRole("Repair Service Technician"),
  ServiceBookingController.acceptServiceRequest
);

// Decline service request (Technician)
router.put(
  "/:id/decline",
  verifyPartnerToken,
  checkRole("Repair Service Technician"),
  ServiceBookingController.declineServiceRequest
);

// Update service status (Technician - Ongoing, Completed)
router.put(
  "/:id/update-status",
  verifyPartnerToken,
  checkRole("Repair Service Technician"),
  ServiceBookingController.updateServiceStatus
);

// Complete service with photos & final price (Technician)
router.post(
  "/:id/complete",
  verifyPartnerToken,
  checkRole("Repair Service Technician"),
  ServiceBookingController.completeService
);

// ==================== ADMIN ROUTES ====================

// Get all pending service requests (Admin only)
router.get("/admin/pending", verifyAdminAccessToken, ServiceBookingController.getPendingServiceRequests);

// Get all service requests (Admin only)
router.get("/admin/all", verifyAdminAccessToken, ServiceBookingController.getAllServiceRequests);

// Manually assign/reassign technician (Admin only)
router.post("/admin/assign-technician", verifyAdminAccessToken, ServiceBookingController.assignTechnicianToService);

// ==================== NOTES ====================
/*
SERVICE BOOKING FLOW:

1. Customer requests service (selects technician from list)
   POST /api/service/request → Status: "Request Placed"

2. Technician accepts/declines
   PUT /api/service/:id/accept → Status: "Service Accepted"
   PUT /api/service/:id/decline → Customer/Admin finds another technician

3. Technician updates status
   PUT /api/service/:id/update-status (body: { status: "Service Ongoing" })
   → startedAt timestamp recorded

4. Technician completes service
   POST /api/service/:id/complete 
   (body: { 
     actualTotal: 2000,
     beforePhotos: ["url1", "url2"],
     afterPhotos: ["url3", "url4"],
     technicianNotes: "..."
   })
   → Status: "Service Completed"
   → Duration calculated
   → Transaction created for technician

5. Customer rates & reviews
   POST /api/review/create

ADMIN FEATURES:
- View all pending requests
- Manually assign/reassign technician if needed
- Monitor all service bookings
*/

export default router;