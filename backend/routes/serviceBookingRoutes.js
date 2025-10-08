import express from "express";
import serviceBookingControllers from "../controllers/serviceBookingControllers.js"
const router = express.Router();

// Create service order
router.post("/createServiceOrder", serviceBookingControllers.createServiceOrder);

// Get all service orders for a customer
router.get("/getServiceOrders/:customerId", serviceBookingControllers.getServiceOrders);

// Get a single service order by ID
router.get("/getServiceOrder/:orderId", serviceBookingControllers.getServiceOrderById);

export default router;
