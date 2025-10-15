
import express from "express";
import ratingController from "../controllers/ratingController.js";

const router = express.Router();

// Create a new rating (customer must be logged in)
router.post("/createRating",  ratingController.createRating);

// Get all ratings by a specific customer
router.get("/getRatingsByCustomer/:customerId", ratingController.getRatingsByCustomer);

// Get all ratings for a specific employee
router.get("/getRatingsByEmployee/:employeeId", ratingController.getRatingsByEmployee);

// Get employee summary (avg rating & count)
router.get("/getEmployeeSummary/:employeeId/summary", ratingController.getEmployeeSummary);

// Update a rating (only owner)
router.put("/updateRating/:ratingId",  ratingController.updateRating);

// Delete a rating (owner or admin)
router.delete("/deleteRating/:ratingId",  ratingController.deleteRating);

export default router;
