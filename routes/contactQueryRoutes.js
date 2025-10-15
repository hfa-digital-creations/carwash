import express from "express";
import contactQueryController from "../controllers/ContactQueryController.js";

const router = express.Router();

// ✅ Create a new contact query
router.post("/createQuery", contactQueryController.createQuery);

// ✅ Get all contact queries
router.get("/getAllQueries", contactQueryController.getAllQueries);

// ✅ Get a single contact query by ID
router.get("/getQueryById/:id", contactQueryController.getQueryById);

export default router;
