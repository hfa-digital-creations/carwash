import express from "express";
import ratingController from "../controllers/ratingController.js";

const router = express.Router();

// ================= Customer Endpoints ==================

// Create a new rating (customer must be logged in)
router.post("/createRating", ratingController.createRating);

// Get all ratings by a specific customer
router.get("/getRatingsByCustomer/:customerId", ratingController.getRatingsByCustomer);

// ================= Employee Endpoints ==================

// Get all ratings for a specific employee
router.get("/getRatingsByEmployee/:employeeId", ratingController.getRatingsByEmployee);

// Get employee summary (avg rating & count)
router.get("/getEmployeeSummary/:employeeId/summary", ratingController.getEmployeeSummary);

// ================= Rating Management ==================

// Update a rating (only owner)
router.put("/updateRating/:ratingId", ratingController.updateRating);

// Delete a rating (owner)
router.delete("/deleteRating/:ratingId", ratingController.deleteRating);

// ================= Admin Endpoints ==================

// Get all ratings (including soft-deleted)
router.get("/admin/getAllRatings", ratingController.getAllRatingsAdmin);

// Get only soft-deleted ratings
router.get("/admin/getDeletedRatings", ratingController.getDeletedRatingsAdmin);

export default router;
