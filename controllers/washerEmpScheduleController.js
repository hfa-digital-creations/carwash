import WasherEmpSchedule from "../models/washerEmpScheduleModel.js";
import Booking from "../models/washBookingModels.js";
import WasherEmp from "../models/washerEmpRegistrationModel.js";

import mongoose from "mongoose";

// Accept a booking
const acceptBooking = async (req, res) => {
  try {
    const { bookingId, washerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId) || !mongoose.Types.ObjectId.isValid(washerId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // 🧩 Find washer details
    const washer = await WasherEmp.findById(washerId);
    if (!washer) {
      return res.status(404).json({ message: "Washer employee not found" });
    }

    // ✅ Create washer schedule
    const schedule = await WasherEmpSchedule.create({
      washerEmployeeId: washerId,
      bookingId,
      status: "On the Way"
    });

    // ✅ Update booking with washer details & status
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: "On the Way",
        isWasherAccepted: true, // ✅ mark as accepted
        washerDetails: {
          washerId: washer._id,
          fullName: washer.fullName,
          phone: washer.phone,
          avgRating: washer.avgRating
        }
      },
      { new: true }
    );

    res.status(200).json({
      message: "Booking accepted successfully ✅",
      schedule,
      updatedBooking
    });
  } catch (err) {
    console.error("Error accepting booking:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Decline a booking
 const declineBooking = async (req, res) => {
  try {
    const { bookingId, washerId } = req.body;

    const schedule = await WasherEmpSchedule.create({
      washerEmployeeId: washerId,
      bookingId,
      status: "Declined"
    });

    res.status(200).json({ message: "Booking declined", schedule });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update status (On the Way / Started / Completed)
const updateBookingStatus = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // 1️⃣ Update the schedule
    const updatedSchedule = await WasherEmpSchedule.findByIdAndUpdate(
      scheduleId,
      { status },
      { new: true }
    );

    if (!updatedSchedule) return res.status(404).json({ message: "Schedule not found" });

    // 2️⃣ Update the Booking status as well
    const updatedBooking = await Booking.findByIdAndUpdate(
      updatedSchedule.bookingId,
      { status },
      { new: true }
    );

    res.status(200).json({ 
      message: "Status updated for both schedule and booking", 
      updatedSchedule, 
      updatedBooking 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get all schedules or schedules for a specific washer
// Get all schedules or schedules for a specific washer
const getAllSchedules = async (req, res) => {
  try {
    const { washerId } = req.query; // e.g. ?washerId=66a7cfae23...

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

    // 🧮 Calculate amount details for each booking
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


// Delete a schedule
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
}