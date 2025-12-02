import express from "express";
import cartController from "../controllers/cartItemControllers.js";

const router = express.Router();

// Add product to cart
router.post("/addProductCart", cartController.addProductToCart);

// Add service to cart
router.post("/addServiceCart", cartController.addServiceToCart);

// Get all carts (admin purpose)
router.get("/getAllCarts/all", cartController.getAllCarts);

// Get cart by customerId
router.get("/getCartByCustomerId/:customerId", cartController.getCartByCustomerId);

// Remove item from cart
router.put("/removeItemFromCart", cartController.removeItemFromCart);

// Clear cart for a customer
router.delete("/clearCart/:customerId", cartController.clearCart);

export default router;
