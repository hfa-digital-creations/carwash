import Booking from "../models/washBookingModels.js";
import Customer from "../models/customerModels.js";
import mongoose from "mongoose";


// -------------------- CREATE BOOKING --------------------
const createBooking = async (req, res) => {
  try {
    const {
      customerId,
      vehicleType,
      vehicleNumber,
      washPackage,
      serviceType,
      address,
      bookingDate,
      bookingTime,
      paymentMethod,
      paymentStatus
    } = req.body;

    if (!customerId || !vehicleType || !vehicleNumber || !washPackage || !serviceType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["Normal", "Express"].includes(serviceType)) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    const customerExists = await Customer.findById(customerId);
    if (!customerExists) return res.status(400).json({ message: "Customer not found" });

    if (!address || !address.street || !address.city || !address.pincode) {
      return res.status(400).json({ message: "Address is required" });
    }

    if (serviceType === "Express" && (!bookingDate || !bookingTime)) {
      return res.status(400).json({ message: "Date and time are required for Express service" });
    }

    const newBooking = new Booking({
      customerId,
      vehicleType,
      vehicleNumber,
      washPackage,
      serviceType,
      address,
      bookingDate: serviceType === "Express" ? bookingDate : null,
      bookingTime: serviceType === "Express" ? bookingTime : null,
      paymentMethod,
      paymentStatus
    });

    await newBooking.save();
    res.status(201).json({ message: "Booking created successfully", booking: newBooking });

  } catch (error) {
    console.error("Error creating booking:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- GET ALL BOOKINGS --------------------
  const getAllWashBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    res.status(200).json({ message: "All wash bookings fetched successfully", bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error); // log full error
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

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking fetched successfully", booking });
  } catch (error) {
    console.error("Error fetching booking:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
// -------------------- GET BOOKINGS BY CUSTOMER ID --------------------
const getBookingsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Validate customerId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    // Find bookings for this customer & populate customer info
    const bookings = await Booking.find({ customerId })
      .populate("customerId", "fullName email phoneNumber")
      .sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found for this customer" });
    }

    res.status(200).json({ message: "Bookings fetched successfully", bookings });
  } catch (error) {
    console.error("Error fetching bookings by customer ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// -------------------- UPDATE BOOKING --------------------
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedBooking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
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

    if (!deletedBooking) return res.status(404).json({ message: "Booking not found" });

    res.status(200).json({ message: "Booking deleted successfully" });
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
  updateBooking,
  deleteBooking
};
