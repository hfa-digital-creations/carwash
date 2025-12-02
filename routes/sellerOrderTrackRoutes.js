import express from "express";
import sellerOrderTrackController from "../controllers/sellerOrderTrackController.js";

const router = express.Router();

// -------------------- CREATE / ACCEPT ORDER --------------------
router.post("/accept", sellerOrderTrackController.acceptSellerOrder);

// -------------------- UPDATE ORDER STATUS --------------------
router.put("/status/:trackId", sellerOrderTrackController.updateSellerOrderStatus);

// -------------------- GET ORDERS --------------------
// Get all orders or filter by sellerId: /api/seller-orders?sellerId=<id>
router.get("/", sellerOrderTrackController.getSellerOrders);

// -------------------- DELETE ORDER TRACK --------------------
router.delete("/:trackId", sellerOrderTrackController.deleteSellerTrack);

export default router;
