import express from "express";
import serviceBookingController from "../controllers/serviceBookingControllers.js";

const router = express.Router();

// Create service order
router.post("/createServiceOrder", serviceBookingController.createServiceOrder);

// Get all service orders (admin)
router.get("/getAllServiceOrders", serviceBookingController.getAllServiceOrders);

// Get service orders by customer ID
router.get("/getServiceOrdersByCustomer/:customerId", serviceBookingController.getServiceOrdersByCustomer);

// Get single service order by ID
router.get("/getServiceOrderById/:orderId", serviceBookingController.getServiceOrderById);

router.put("/cancelServiceOrder/:orderId", serviceBookingController.cancelServiceOrder);

// Update service order
router.put("/updateServiceOrder/:orderId", serviceBookingController.updateServiceOrder);

// Delete service order
router.delete("/deleteServiceOrder/:orderId", serviceBookingController.deleteServiceOrder);

export default router;
