import mongoose from "mongoose";

const contactQuerySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    category: {
      type: String,
      enum: ["General", "Service", "Booking", "Feedback", "Other"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Responded"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ContactQuery", contactQuerySchema);
