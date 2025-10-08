import express from "express";
import CustomerShoppingController from "../controllers/CustomerShoppingController.js";

const router = express.Router();

// Create order
router.post("/createOrder", CustomerShoppingController.createOrder);

// Get all orders
router.get("/getAllOrders", CustomerShoppingController.getAllOrders);

// Get order by ID
router.get("/getOrderById/:id", CustomerShoppingController.getOrderById);

// Get orders by customer ID
router.get("/getOrderedItems/:customerId", CustomerShoppingController.getOrderedItems);

// Update order by ID
router.put("/updateOrder/:id", CustomerShoppingController.updateOrder);

// Delete order by ID
router.delete("/deleteOrder/:id", CustomerShoppingController.deleteOrder);

export default router;
