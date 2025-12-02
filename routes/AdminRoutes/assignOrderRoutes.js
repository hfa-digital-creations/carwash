import express from "express";
import assignOrderController from "../../controllers/AdminControllers/assignOrderController.js";

const router = express.Router();

// ✅ Create / Assign Order
router.post("/createAssignOrder", assignOrderController.createAssignOrder);

// 🔄 Update Assigned Order
router.put("/updateAssignOrder/:id", assignOrderController.updateAssignOrder);

// 🗑️ Delete Assigned Order
router.delete("/deleteAssignOrder/:id", assignOrderController.deleteAssignOrder);

// 📜 Get All Assigned Orders
router.get("/getAllAssignOrders/getAll", assignOrderController.getAllAssignOrders);

// 🔍 Get Assigned Order by ID
router.get("/getAssignOrderById/:id", assignOrderController.getAssignOrderById);

// ❌ Decline / Cancel Assigned Order
router.put("/declineAssignOrder/:id", assignOrderController.declineAssignOrder);

export default router;
