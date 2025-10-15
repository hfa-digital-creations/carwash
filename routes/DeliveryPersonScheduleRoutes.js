import express from "express";
import DeliveryPersonScheduleController from "../controllers/DeliveryPersonScheduleController.js";

const router = express.Router();

// ✅ Accept a delivery order
// POST /deliveryPersonSchedule/acceptOrder
router.post("/acceptOrder", DeliveryPersonScheduleController.acceptOrder);

// ✅ Decline a delivery order
// POST /deliveryPersonSchedule/declineOrder
router.post("/declineOrder", DeliveryPersonScheduleController.declineOrder);

// ✅ Update order status (On the Way / Picked Up / Completed / Cancelled)
// PUT /deliveryPersonSchedule/updateOrderStatus/:scheduleId
router.put(
  "/updateOrderStatus/:scheduleId",
  DeliveryPersonScheduleController.updateOrderStatus
);

// ✅ Get all schedules or schedules for a specific delivery person
// GET /deliveryPersonSchedule/getAllSchedules?deliveryPersonId=xxxx
router.get("/getAllSchedules", DeliveryPersonScheduleController.getAllSchedules);

// ✅ Delete a schedule
// DELETE /deliveryPersonSchedule/deleteSchedule/:scheduleId
router.delete(
  "/deleteSchedule/:scheduleId",
  DeliveryPersonScheduleController.deleteSchedule
);

export default router;
