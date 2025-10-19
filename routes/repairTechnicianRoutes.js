import express from "express";
import repairTechnicianController from "../controllers/repairTechnicianController.js";

const router = express.Router();

// ✅ Create new Repair Technician
router.post("/createRepairTechnician", repairTechnicianController.createRepairTechnician);

// ✅ Get all Repair Technicians
router.get("/getAllRepairTechnicians", repairTechnicianController.getAllRepairTechnicians);

// ✅ Get Repair Technician by ID
router.get("/getRepairTechnicianById/:id", repairTechnicianController.getRepairTechnicianById);

// ✅ Update Repair Technician (full update)
router.put("/updateRepairTechnician/:id", repairTechnicianController.updateRepairTechnician);

// ✅ Delete Repair Technician
router.delete("/deleteRepairTechnician/:id", repairTechnicianController.deleteRepairTechnician);

export default router;
