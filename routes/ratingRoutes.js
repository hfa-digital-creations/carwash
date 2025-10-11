
import express from "express";
import ratingController from "../controllers/ratingController.js";

const router = express.Router();

// Create a new rating (customer must be logged in)
router.post("/",  ratingController.createRating);

// Get all ratings for a specific employee
router.get("/employee/:employeeId", ratingController.getRatingsByEmployee);

// Get employee summary (avg rating & count)
router.get("/employee/:employeeId/summary", ratingController.getEmployeeSummary);

// Update a rating (only owner)
router.put("/:ratingId",  ratingController.updateRating);

// Delete a rating (owner or admin)
router.delete("/:ratingId",  ratingController.deleteRating);

export default router;
