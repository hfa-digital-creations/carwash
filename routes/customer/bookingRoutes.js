import express from "express";
import BookingController from "../../controllers/customer/bookingControllers.js";
import { verifyAccessToken } from "../../middlewares/authMiddleware.js";
import { verifyAccessToken as verifyPartnerToken } from "../../middlewares/partnerAuthMiddleware.js";
import { verifyAdminAccessToken, superAdminOnly } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get available services (Public)
router.get("/services", BookingController.getAvailableServices);

// ==================== CUSTOMER ROUTES ====================

// Calculate booking cost
router.post("/calculate-cost", verifyAccessToken, BookingController.calculateBookingCost);

// ✅ STEP 1: Create booking (WITHOUT payment)
router.post("/create", verifyAccessToken, BookingController.createBooking);

// ✅ STEP 2: Make advance payment (SEPARATE endpoint)
router.post("/:id/pay-advance", verifyAccessToken, BookingController.makeAdvancePayment);

// ✅ STEP 3: Make balance payment (After service completion)
router.post("/:id/pay-balance", verifyAccessToken, BookingController.makeBalancePayment);

// Get my bookings
router.get("/my-bookings", verifyAccessToken, BookingController.getMyBookings);

// Get booking by ID
router.get("/:id", BookingController.getBookingById);

// Cancel booking
router.put("/:id/cancel", verifyAccessToken, BookingController.cancelBooking);

// ==================== PARTNER ROUTES ====================

// Get partner's scheduled jobs
router.get("/partner/scheduled", verifyPartnerToken, BookingController.getPartnerScheduledJobs);

// Accept booking
router.put("/:id/accept", verifyPartnerToken, BookingController.acceptBooking);

// Decline booking
router.put("/:id/decline", verifyPartnerToken, BookingController.declineBooking);

// Update booking status
router.put("/:id/update-status", verifyPartnerToken, BookingController.updateBookingStatus);

// ==================== ADMIN ROUTES ====================

// Get all pending bookings
router.get("/admin/pending", verifyAdminAccessToken, superAdminOnly, BookingController.getPendingBookings);

// Get all bookings with filter
router.get("/admin/all", verifyAdminAccessToken, superAdminOnly, BookingController.getAllBookings);

// Approve booking
router.put("/admin/:id/approve", verifyAdminAccessToken, superAdminOnly, BookingController.approveBooking);

// Manually assign partner
router.post("/admin/assign-partner", verifyAdminAccessToken, superAdminOnly, BookingController.assignPartnerToBooking);

// ==================== NEW PAYMENT FLOW ====================
/*
STEP 1: Create Booking (No Payment)
POST /api/booking/create
Body: {
  customerId, serviceId, vehicleType, address, expressService, scheduledDate, scheduledTime, couponCode
}
Response: {
  booking: { bookingId, status: "Payment Pending", pricing: { advanceRequired: 8 } },
  nextStep: { action: "Make advance payment", endpoint: "/api/booking/:id/pay-advance", amount: 8 }
}

STEP 2: Make Advance Payment
POST /api/booking/:id/pay-advance
Body: {
  paymentMethod: "UPI",
  advancePayment: 8,
  transactionId: "TXN123456"
}
Response: {
  booking: { status: "Pending", paymentStatus: "Partially Paid" },
  note: "Pending admin approval"
}

STEP 3: Admin Approves → Partner Completes

STEP 4: Make Balance Payment (After service)
POST /api/booking/:id/pay-balance
Body: {
  paymentMethod: "Cash",
  balancePayment: 17,
  transactionId: "TXN789012"
}
Response: {
  booking: { paymentStatus: "Fully Paid", balanceDue: 0 },
  note: "Thank you! Please rate your experience."
}
*/

export default router;