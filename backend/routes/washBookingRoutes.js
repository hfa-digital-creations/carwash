import express from "express";
import washBookingControllers from "../controllers/washBookingControllers.js";

const router = express.Router();

// Create booking
router.post("/createWashBooking", washBookingControllers.createBooking);

// Get all bookings
router.get("/getAllWashBookings", washBookingControllers.getAllWashBookings);

// Get booking by ID
router.get("/getWashBookingById/:id", washBookingControllers.getBookingById);

// Update booking by ID
router.put("/updateWashBooking/:id", washBookingControllers.updateBooking);

// Delete booking by ID
router.delete("/deleteWashBooking/:id", washBookingControllers.deleteBooking);

export default router;
