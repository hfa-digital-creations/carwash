import express from "express";
import BookingController from "../../controllers/customer/bookingControllers.js";
import { verifyAccessToken } from "../../middlewares/authMiddleware.js"; // Customer middleware
import { verifyAccessToken as verifyPartnerToken } from "../../middlewares/partnerAuthMiddleware.js"; // Partner middleware
import { verifyAdminAccessToken, superAdminOnly } from "../../middlewares/adminMiddleware.js"; // Admin middleware

const router = express.Router();

// ==================== CUSTOMER ROUTES ====================

// Create booking (Customer must be logged in)
router.post("/create", verifyAccessToken, BookingController.createBooking);

// Get my bookings (Customer)
router.get("/my-bookings", verifyAccessToken, BookingController.getMyBookings);

// Get booking by ID (Customer, Partner, or Admin can view)
router.get("/:id", BookingController.getBookingById);

// Cancel booking (Customer)
router.put("/:id/cancel", verifyAccessToken, BookingController.cancelBooking);

// ==================== PARTNER ROUTES ====================

// Get partner's scheduled jobs (Partner must be logged in)
router.get("/partner/scheduled", verifyPartnerToken, BookingController.getPartnerScheduledJobs);

// Accept booking (Partner)
router.put("/:id/accept", verifyPartnerToken, BookingController.acceptBooking);

// Decline booking (Partner)
router.put("/:id/decline", verifyPartnerToken, BookingController.declineBooking);

// Update booking status (Partner - On The Way, Arrived, In Progress, Completed)
router.put("/:id/update-status", verifyPartnerToken, BookingController.updateBookingStatus);

// ==================== ADMIN ROUTES ====================

// Get all pending bookings (Admin only)
router.get("/admin/pending", verifyAdminAccessToken, BookingController.getPendingBookings);

// Get all bookings with filter (Admin only)
router.get("/admin/all", verifyAdminAccessToken, BookingController.getAllBookings);

// Approve booking (Admin only)
router.put("/admin/:id/approve", verifyAdminAccessToken, BookingController.approveBooking);

// Manually assign partner to booking (Admin only)
router.post("/admin/assign-partner", verifyAdminAccessToken, BookingController.assignPartnerToBooking);

// ==================== NOTES ====================
/*
BOOKING FLOW:

1. Customer creates booking → Status: "Pending"
   POST /api/booking/create

2. Admin reviews and approves
   PUT /api/booking/admin/:id/approve → Status: "Confirmed"

3. Admin manually assigns partner
   POST /api/booking/admin/assign-partner

4. Partner accepts/declines
   PUT /api/booking/:id/accept → Partner can start work
   PUT /api/booking/:id/decline → Admin reassigns

5. Partner updates status
   PUT /api/booking/:id/update-status
   - "Washer On The Way"
   - "Washer Arrived"
   - "Washing in Progress"
   - "Completed" (creates transaction)

6. Customer rates & reviews
   POST /api/review/create
*/

export default router;