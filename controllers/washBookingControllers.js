import Booking from "../models/washBookingModels.js";
import Customer from "../models/customerModels.js";
import WashService from "../models/washServiceType.js";
import washerEmp from "../models/washerEmpRegistrationModel.js";
import WasherEmpSchedule from "../models/washerEmpScheduleModel.js"; // ✅ add this line

import mongoose from "mongoose";


// -------------------- CREATE BOOKING --------------------
const createBooking = async (req, res) => {
  try {
    const {
      customerId,
      vehicleType,
      vehicleNumber,
      washPackageId, // ✅ changed to ID
      serviceType,
      address,
      bookingDate,
      bookingTime,
      expressCharge = 0,
      advanceBookingCharge = 0,
      couponCode = null,
      discountAmount = 0,
      paymentMethod,
      paymentStatus
    } = req.body;

    // ✅ Basic validation
    if (!customerId || !vehicleType || !vehicleNumber || !washPackageId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Service type validation
    if (serviceType === "Normal" && (!bookingDate || !bookingTime)) {
      return res.status(400).json({
        message: "Booking date and time required for normal service",
      });
    }

    // ✅ Check customer
    const customerExists = await Customer.findById(customerId);
    if (!customerExists)
      return res.status(404).json({ message: "Customer not found" });

    // ✅ Fetch selected wash package
    const selectedPackage = await WashService.findById(washPackageId);
    if (!selectedPackage)
      return res.status(404).json({ message: "Wash package not found" });

    // ✅ Calculate total
    const basePrice = selectedPackage.price;
    const totalBeforeDiscount = basePrice + expressCharge + advanceBookingCharge;
    const totalAfterDiscount = Math.max(totalBeforeDiscount - discountAmount, 0);

    // ✅ Create booking document
    const newBooking = new Booking({
      customerId,
      vehicleType,
      vehicleNumber,
      washPackage: {
        packageName: selectedPackage.packageName,
        price: selectedPackage.price,
        description: selectedPackage.description,
        features: selectedPackage.features,
      },
      serviceType,
      address,
      bookingDate: serviceType === "Express" ? null : bookingDate || null,
      bookingTime: serviceType === "Express" ? null : bookingTime || null,
      expressCharge,
      advanceBookingCharge,
      couponCode,
      discountAmount,
      totalAmount: totalAfterDiscount,
      paymentMethod,
      paymentStatus,
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully ✅",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET ALL BOOKINGS --------------------
const getAllWashBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customerId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    res.status(200).json({
      message: "All wash bookings fetched successfully",
      bookings
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET BOOKING BY ID --------------------
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(id)
      .populate("customerId", "fullName email phoneNumber");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking fetched successfully",
      booking
    });
  } catch (error) {
    console.error("Error fetching booking:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- GET BOOKINGS BY CUSTOMER ID --------------------
const getBookingsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const bookings = await Booking.find({ customerId })
      .populate("customerId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this customer" });
    }

    res.status(200).json({
      message: "Bookings fetched successfully",
      bookings
    });
  } catch (error) {
    console.error("Error fetching bookings by customer ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// -------------------- GET FULL BOOKING DETAILS --------------------
const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // ✅ Fetch booking & populate washer + customer info
    const booking = await Booking.findById(id)
      .populate("customerId", "fullName email phoneNumber address")
      .populate("washerDetails.washerId", "fullName email phone avgRating");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Fetch schedule using the correct model
    const schedule = await WasherEmpSchedule.findOne({ bookingId: id });

    // ✅ If no schedule yet
    if (!schedule) {
      return res.status(200).json({
        message: "Booking fetched successfully (no schedule yet)",
        booking,
        progress: ["Pending"],
      });
    }

    // ✅ Use schedule progress
    const progressMessages = schedule.progress || ["Pending"];

    res.status(200).json({
      message: "Booking details fetched successfully ✅",
      booking,
      progress: progressMessages,
       // Optional: also return current status
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




// -------------------- CANCEL BOOKING --------------------
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if booking ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // If already canceled, stop further updates
    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Update booking status
    booking.status = "Cancelled";
    booking.cancelReason = req.body.reason || "Cancelled by user";
    booking.cancelledAt = new Date();

    await booking.save();

    res.status(200).json({
      message: "Booking cancelled successfully ✅",
      booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// -------------------- UPDATE BOOKING --------------------
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If washPackage name is changed, fetch full service details
    if (updateData.washPackage && typeof updateData.washPackage === "string") {
      const service = await WashService.findOne({ packageName: updateData.washPackage });
      if (!service) {
        return res.status(400).json({ message: "Invalid wash package" });
      }
      updateData.washPackage = {
        packageName: service.packageName,
        price: service.price,
        description: service.description,
        features: service.features
      };
    }

    const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking updated successfully",
      booking: updatedBooking
    });
  } catch (error) {
    console.error("Error updating booking:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- DELETE BOOKING --------------------
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBooking = await Booking.findByIdAndDelete(id);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully ✅" });
  } catch (error) {
    console.error("Error deleting booking:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  createBooking,
  getAllWashBookings,
  getBookingsByCustomerId,
  getBookingById,
  getBookingDetails,
  cancelBooking,
  updateBooking,
  deleteBooking
};
