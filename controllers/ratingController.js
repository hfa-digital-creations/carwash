import Rating from "../models/ratingModels.js";
import ServiceEmployee from "../models/washerEmpRegistrationModel.js";
import mongoose from "mongoose";

// Create rating
const createRating = async (req, res) => {
  try {
    const { employeeId, serviceBookingId, customerShoppingId, washBookingId, score, comment } = req.body;
    const customerId = req.user?.id || req.body.customerId; // auth middleware

    if (!employeeId && !serviceBookingId && !customerShoppingId && !washBookingId) {
      return res.status(400).json({ message: "Please provide a target to rate" });
    }

    // Validate ObjectIds
    const targets = { employeeId, serviceBookingId, customerShoppingId, washBookingId };
    for (const key in targets) {
      if (targets[key] && !mongoose.Types.ObjectId.isValid(targets[key])) {
        return res.status(400).json({ message: `Invalid ${key}` });
      }
    }

    const rating = await Rating.create({ customerId, employeeId, serviceBookingId, customerShoppingId, washBookingId, score, comment });

    // Update employee aggregate if employeeId is provided
    if (employeeId) {
      const agg = await Rating.aggregate([
        { $match: { employeeId: new mongoose.Types.ObjectId(employeeId), isDeleted: false } }, // ignore deleted
        { $group: { _id: "$employeeId", avg: { $avg: "$score" }, count: { $sum: 1 } } }
      ]);

      if (agg.length) {
        await ServiceEmployee.findByIdAndUpdate(employeeId, {
          avgRating: agg[0].avg,
          ratingCount: agg[0].count
        });
      }
    }

    res.status(201).json({ message: "Rating created", rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all ratings by a specific customer
const getRatingsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    const ratings = await Rating.find({ customerId, isDeleted: false }) // ignore deleted
      .populate("employeeId", "fullName role")
      .populate("serviceBookingId", "bookingDate serviceType")
      .populate("customerShoppingId", "orderNumber totalAmount")
      .populate("washBookingId", "bookingDate packageName")
      .sort({ createdAt: -1 });

    res.json({ ratings });
  } catch (err) {
    console.error("Error in getRatingsByCustomer:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all ratings for an employee
const getRatingsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "Invalid employeeId" });
    }

    const ratings = await Rating.find({ employeeId, isDeleted: false }) // ignore deleted
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });

    res.json({ ratings });
  } catch (err) {
    console.error("Error in getRatingsByEmployee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get average rating (fast read from employee)
const getEmployeeSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await ServiceEmployee.findById(employeeId).select("fullName avgRating ratingCount");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ employee });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update rating (only owner)
const updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const customerId = req.user?.id;
    const { score, comment } = req.body;

    const rating = await Rating.findById(ratingId);
    if (!rating) return res.status(404).json({ message: "Rating not found" });
    if (rating.customerId.toString() !== customerId) return res.status(403).json({ message: "Not allowed" });

    rating.score = score ?? rating.score;
    rating.comment = comment ?? rating.comment;
    await rating.save();

    // recompute employee aggregates if employeeId exists
    if (rating.employeeId) {
      const agg = await Rating.aggregate([
        { $match: { employeeId: mongoose.Types.ObjectId(rating.employeeId), isDeleted: false } }, // ignore deleted
        { $group: { _id: "$employeeId", avg: { $avg: "$score" }, count: { $sum: 1 } } }
      ]);
      if (agg.length) {
        await ServiceEmployee.findByIdAndUpdate(rating.employeeId, {
          avgRating: agg[0].avg,
          ratingCount: agg[0].count
        });
      }
    }

    res.json({ message: "Rating updated", rating });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Soft delete rating (owner or admin)
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { customerId } = req.query; // <-- read from query

    if (!customerId) return res.status(400).json({ message: "Customer ID is required" });

    const rating = await Rating.findById(ratingId);
    if (!rating) return res.status(404).json({ message: "Rating not found" });

    // Only the owner or admin can soft delete
    // Here you can pass role=admin in query if needed, or skip for simplicity
    if (rating.customerId.toString() !== customerId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Soft delete
    rating.isDeleted = true;
    await rating.save();

    // Recompute employee aggregates
    if (rating.employeeId) {
      const agg = await Rating.aggregate([
        { $match: { employeeId: mongoose.Types.ObjectId(rating.employeeId), isDeleted: false } },
        { $group: { _id: "$employeeId", avg: { $avg: "$score" }, count: { $sum: 1 } } }
      ]);

      if (agg.length) {
        await ServiceEmployee.findByIdAndUpdate(rating.employeeId, {
          avgRating: agg[0].avg,
          ratingCount: agg[0].count
        });
      } else {
        await ServiceEmployee.findByIdAndUpdate(rating.employeeId, { avgRating: 0, ratingCount: 0 });
      }
    }

    res.json({ message: "Rating hidden (soft deleted)" });
  } catch (err) {
    console.error("Delete rating error:", err);
    res.status(500).json({ message: "Server error" });
  }
};





export default {
  createRating,
  getRatingsByCustomer,
  getRatingsByEmployee,
  getEmployeeSummary,
  updateRating,
  deleteRating
};
