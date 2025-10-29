import WasherEmpSchedule from "../models/washerEmpScheduleModel.js";
import Booking from "../models/washBookingModels.js";
import WasherEmp from "../models/washerEmpRegistrationModel.js";
import mongoose from "mongoose";

const STATUS_FLOW = ["On the Way", "Started", "Washing In Progress", "Completed"];

// -------------------- ACCEPT BOOKING --------------------
const acceptBooking = async (req, res) => {
  try {
    const { bookingId, washerId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(bookingId) ||
      !mongoose.Types.ObjectId.isValid(washerId)
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // ✅ Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Prevent multiple acceptance
    if (booking.isWasherAccepted) {
      return res.status(400).json({
        message: "This booking has already been accepted by another washer ❌",
      });
    }

    // ✅ Check washer
    const washer = await WasherEmp.findById(washerId);
    if (!washer)
      return res.status(404).json({ message: "Washer employee not found" });

    // ✅ Create schedule
    const schedule = await WasherEmpSchedule.create({
      washerEmployeeId: washerId,
      bookingId,
      status: "On the Way",
      progress: ["On the Way"],
    });

    // ✅ Update booking to reflect washer acceptance
    booking.status = "On the Way";
    booking.isWasherAccepted = true;
    booking.washerDetails = {
      washerId: washer._id,
      fullName: washer.fullName,
      phone: washer.phone,
      avgRating: washer.avgRating,
    };
    await booking.save();

    // ✅ Calculate progress %
    const STATUS_FLOW = ["On the Way", "Started", "Washing In Progress", "Completed"];
    const progressPercent =
      ((STATUS_FLOW.indexOf(schedule.status) + 1) / STATUS_FLOW.length) * 100;

    res.status(200).json({
      message: "Booking accepted successfully ✅",
      schedule,
      updatedBooking: booking,
      progress: schedule.progress,
      progressPercent,
    });
  } catch (err) {
    console.error("Error accepting booking:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// -------------------- DECLINE BOOKING --------------------
const declineBooking = async (req, res) => {
  try {
    const { bookingId, washerId } = req.body;

    const schedule = await WasherEmpSchedule.create({
      washerEmployeeId: washerId,
      bookingId,
      status: "Declined",
      progress: ["Declined"],
    });

    res.status(200).json({ message: "Booking declined", schedule });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- UPDATE STATUS --------------------
const updateBookingStatus = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const schedule = await WasherEmpSchedule.findById(scheduleId);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    // ✅ Add status message to progress (no duplicates)
    if (!schedule.progress.includes(status)) {
      schedule.progress.push(status);
    }

    schedule.status = status;
    await schedule.save();

    // ✅ Update booking document as well
    const updatedBooking = await Booking.findByIdAndUpdate(
      schedule.bookingId,
      { status },
      { new: true }
    );

    res.status(200).json({
      message: "Booking & schedule status updated ✅",
      updatedSchedule: schedule,
      updatedBooking,
      progress: schedule.progress, // 🆕 Return all messages
    });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- GET ALL SCHEDULES --------------------
const getAllSchedules = async (req, res) => {
  try {
    const { washerId } = req.query;

    let filter = {};
    if (washerId) {
      if (!mongoose.Types.ObjectId.isValid(washerId)) {
        return res.status(400).json({ message: "Invalid washerId" });
      }
      filter = { washerEmployeeId: washerId };
    }

    const schedules = await WasherEmpSchedule.find(filter)
      .populate({
        path: "bookingId",
        populate: { path: "customerId", select: "fullName phoneNumber" },
      })
      .sort({ createdAt: -1 });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({ message: "No schedules found" });
    }

    const result = schedules.map((schedule) => {
      const booking = schedule.bookingId;
      if (!booking) return schedule;

      const basePrice = booking.washPackage?.price || 0;
      const expressCharge = booking.expressCharge || 0;
      const advanceBookingCharge = booking.advanceBookingCharge || 0;
      const discountAmount = booking.discountAmount || 0;

      const calculatedTotal =
        basePrice + expressCharge + advanceBookingCharge - discountAmount;

      return {
        ...schedule.toObject(),
        bookingSummary: {
          vehicleType: booking.vehicleType,
          packageName: booking.washPackage?.packageName,
          serviceType: booking.serviceType,
          date: booking.bookingDate,
          time: booking.bookingTime,
          expressCharge,
          advanceBookingCharge,
          discountAmount,
          couponCode: booking.couponCode,
          basePrice,
          totalAmount: calculatedTotal,
        },
      };
    });

    res.status(200).json({
      message: "Schedules fetched successfully",
      schedules: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- DELETE SCHEDULE --------------------
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const deleted = await WasherEmpSchedule.findByIdAndDelete(scheduleId);
    if (!deleted) return res.status(404).json({ message: "Schedule not found" });

    res.status(200).json({ message: "Schedule deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default {
  acceptBooking,
  declineBooking,
  updateBookingStatus,
  getAllSchedules,
  deleteSchedule,
};
