import express from "express";
import washerEmpScheduleController from "../controllers/washerEmpScheduleController.js";

const router = express.Router();

// Accept a booking
router.post("/washerAcceptBooking", washerEmpScheduleController.acceptBooking);

// Decline a booking
router.post("/washerDeclineBooking", washerEmpScheduleController.declineBooking);

// Update booking status (On the Way / Started / Completed)
router.put("/updateBookingStatus/:scheduleId", washerEmpScheduleController.updateBookingStatus);

// Get all schedules or schedules for a specific washer
// Use query param ?washerId=<id> to filter by washer
router.get("/getAllWasherSchedules", washerEmpScheduleController.getAllSchedules);

// Delete a schedule
router.delete("/deleteSchedule/:scheduleId", washerEmpScheduleController.deleteSchedule);

export default router;
