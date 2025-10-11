import mongoose from "mongoose";

const washerBookingStatusSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WashBooking", 
    required: true 
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "WasherEmployee", 
    required: true 
  },
  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "ON_THE_WAY", "STARTED_WASH", "COMPLETED"],
    default: "PENDING"
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

export default mongoose.model("WasherBookingStatus", washerBookingStatusSchema);
