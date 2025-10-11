import Rating from "../models/ratingModels.js";
import ServiceEmployee from "../models/ServiceEmployee.js";
import mongoose from "mongoose";

// Create rating
const createRating = async (req, res) => {
  try {
    const { employeeId, score, comment, serviceBookingId } = req.body;
    const customerId = req.user?.id || req.body.customerId; // assume auth middleware sets req.user

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: "Invalid employeeId" });
    }

    // optional: check if customer already rated the same booking
    // const exists = await Rating.findOne({ customerId, serviceBookingId });
    // if (exists) return res.status(400).json({ message: "Already rated this booking" });

    const rating = await Rating.create({ customerId, employeeId, score, comment, serviceBookingId });

    // update employee aggregate (simple approach)
    const agg = await Rating.aggregate([
      { $match: { employeeId: mongoose.Types.ObjectId(employeeId) } },
      { $group: { _id: "$employeeId", avg: { $avg: "$score" }, count: { $sum: 1 } } }
    ]);

    if (agg.length) {
      await ServiceEmployee.findByIdAndUpdate(employeeId, {
        avgRating: agg[0].avg,
        ratingCount: agg[0].count
      });
    }

    res.status(201).json({ message: "Rating created", rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all ratings for an employee
const getRatingsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const ratings = await Rating.find({ employeeId }).populate("customerId", "name email").sort({ createdAt: -1 });
    res.json({ ratings });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get average rating (fast read from employee)
const getEmployeeSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await ServiceEmployee.findById(employeeId).select("name avgRating ratingCount");
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

    // recompute aggregates
    const agg = await Rating.aggregate([
      { $match: { employeeId: mongoose.Types.ObjectId(rating.employeeId) } },
      { $group: { _id: "$employeeId", avg: { $avg: "$score" }, count: { $sum: 1 } } }
    ]);
    if (agg.length) {
      await ServiceEmployee.findByIdAndUpdate(rating.employeeId, {
        avgRating: agg[0].avg,
        ratingCount: agg[0].count
      });
    }

    res.json({ message: "Rating updated", rating });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete rating (owner or admin)
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const customerId = req.user?.id;
    const rating = await Rating.findById(ratingId);
    if (!rating) return res.status(404).json({ message: "Rating not found" });
    // allow if owner or admin (assume req.user.role)
    if (rating.customerId.toString() !== customerId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const employeeId = rating.employeeId;
    await rating.remove();

    // recompute aggregates
    const agg = await Rating.aggregate([
      { $match: { employeeId: mongoose.Types.ObjectId(employeeId) } },
      { $group: { _id: "$employeeId", avg: { $avg: "$score" }, count: { $sum: 1 } } }
    ]);

    if (agg.length) {
      await ServiceEmployee.findByIdAndUpdate(employeeId, {
        avgRating: agg[0].avg,
        ratingCount: agg[0].count
      });
    } else {
      // no ratings remain
      await ServiceEmployee.findByIdAndUpdate(employeeId, { avgRating: 0, ratingCount: 0 });
    }

    res.json({ message: "Rating deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  createRating,
  getRatingsByEmployee,
  getEmployeeSummary,
  updateRating,
  deleteRating
}