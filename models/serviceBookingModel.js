import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    serviceItems: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceItem", required: true },
        productImage: { type: String },
        productName: { type: String, required: true },
        description: { type: String },
        serviceCharges: { type: Number, required: true },
        serviceStore: {
          storeName: { type: String, required: true },
          storeAddress: { type: String, required: true },
          contactNumber: { type: String },
        },
      },
    ],

    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true },
      },
    },

    date: { type: Date, required: true },
    time: { type: String, required: true },

    payment: {
      method: { type: String, required: true },
      transactionId: { type: String },
      amount: { type: Number, required: true },
      status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
    },

    serviceStatus: {
      type: String,
      enum: ["Pending", "Accepted", "Processing", "Completed", "Cancelled"],
      default: "Pending",
    },

    repairTechnicianId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairTechnician" },

    // ✅ NEW FIELDS
    isTechnicianAccepted: { type: Boolean, default: false },
    technicianDetails: {
      technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairTechnician" },
      fullName: { type: String },
      phone: { type: String },
      avgRating: { type: Number },
    },
    estimatedArrival: { type: Date },
    progress: [
      {
        status: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    technicianAcceptedAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);


const CustomerService = mongoose.model("CustomerService", serviceBookingSchema);

export default CustomerService;
