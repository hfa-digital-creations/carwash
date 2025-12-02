import express from "express";
import repairTechnicianScheduleController from "../controllers/repairTechnicianScheduleController.js";

const router = express.Router();

router.post("/acceptService", repairTechnicianScheduleController.acceptService);
router.post("/declineService", repairTechnicianScheduleController.declineService);
router.put("/updateService/:scheduleId", repairTechnicianScheduleController.updateServiceStatus);
router.get("/getAllSchedules", repairTechnicianScheduleController.getAllSchedules);
router.delete("/deleteSchedule/:scheduleId", repairTechnicianScheduleController.deleteSchedule);

export default router;
