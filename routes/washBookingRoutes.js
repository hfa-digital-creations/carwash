import express from "express";
import washBookingControllers from "../controllers/washBookingControllers.js";

const router = express.Router();

// Create booking
router.post("/createWashBooking", washBookingControllers.createBooking);

// Get all bookings
router.get("/getAllWashBookings", washBookingControllers.getAllWashBookings);

// Get bookings by customer ID
router.get("/getBookingsByCustomerId/:customerId", washBookingControllers.getBookingsByCustomerId);

// Get booking by ID
router.get("/getWashBookingById/:id", washBookingControllers.getBookingById);

router.get("/getBookingDetails/:id", washBookingControllers.getBookingDetails);

// Update booking by ID
router.put("/updateWashBooking/:id", washBookingControllers.updateBooking);

// Cancel booking by ID ✅
router.put("/cancelWashBooking/:id", washBookingControllers.cancelBooking);

// Delete booking by ID
router.delete("/deleteWashBooking/:id", washBookingControllers.deleteBooking);

export default router;
