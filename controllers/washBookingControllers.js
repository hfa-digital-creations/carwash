import Booking from "../models/washBookingModels.js";
import Customer from "../models/customerModels.js";
import WashService from "../models/washServiceType.js";
import mongoose from "mongoose";

// -------------------- CREATE BOOKING --------------------


const createBooking = async (req, res) => {
  try {
    const {
      customerId,
      vehicleType,
      vehicleNumber,
      washPackage, // this is now an object
      serviceType,
      address,
      bookingDate,
      bookingTime,
      paymentMethod,
      paymentStatus
    } = req.body;

    if (!customerId || !vehicleType || !vehicleNumber || !washPackage.packageName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const customerExists = await Customer.findById(customerId);
    if (!customerExists) return res.status(400).json({ message: "Customer not found" });

    // ✅ No need to find again from DB if full object is sent
    const newBooking = new Booking({
      customerId,
      vehicleType,
      vehicleNumber,
      washPackage: {
        packageName: washPackage.packageName,
        price: washPackage.price,
        description: washPackage.description,
        features: washPackage.features,
      },
      serviceType,
      address,
      bookingDate: bookingDate || null,
      bookingTime: bookingTime || null,
      paymentMethod,
      paymentStatus
    });

    await newBooking.save();
    res.status(201).json({ message: "Booking created successfully ✅", booking: newBooking });

  } catch (error) {
    console.error("Error creating booking:", error.message);
    res.status(500).json({ message: "Server error" });
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
  updateBooking,
  deleteBooking
};
