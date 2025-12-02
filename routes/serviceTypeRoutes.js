import express from "express";
import serviceTypeControllers from "../controllers/serviceTypeControllers.js";

const router = express.Router();

// 🟢 Create Service Type
router.post("/create", serviceTypeControllers.createServiceType);

// 🟡 Get All Service Types
router.get("/getall", serviceTypeControllers.getAllServiceTypes);

// 🟢 Get Service Type By ID
router.get("/:id", serviceTypeControllers.getServiceTypeById);

// 🟣 Update Service Type
router.put("/update/:id", serviceTypeControllers.updateServiceType);

// 🔴 Delete Service Type
router.delete("/delete/:id", serviceTypeControllers.deleteServiceType);

export default router;
