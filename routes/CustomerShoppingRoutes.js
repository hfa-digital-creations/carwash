import express from "express";
import CustomerShoppingController from "../controllers/CustomerShoppingController.js";

const router = express.Router();

// Create order
router.post("/createOrder", CustomerShoppingController.createOrder);

// Get all orders
router.get("/getAllOrders", CustomerShoppingController.getAllOrders);

// Get order by ID
router.get("/getOrderById/:id", CustomerShoppingController.getOrderById);

// ✅ New Route — Get Full Order Details (Customer + Picker + Products)
router.get("/getOrderDetails/:id", CustomerShoppingController.getOrderDetailsById);

// Get orders by customer ID
router.get("/getOrderedItems/:customerId", CustomerShoppingController.getOrderedItems);

// Cancel order by ID
router.put("/cancelOrder/:id", CustomerShoppingController.cancelOrder);

// Delete order by ID
router.delete("/deleteOrder/:id", CustomerShoppingController.deleteOrder);

export default router;
