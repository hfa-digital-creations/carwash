import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema(
  {
    // 🔹 Auto-generated unique service order ID
    serviceOrderId: {
      type: String,
      unique: true,
      default: null,
    },

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

    isTechnicianAccepted: { type: Boolean, default: false },
    technicianDetails: {
      technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "RepairTechnician" },
      fullName: { type: String },
      phone: { type: String },
      avgRating: { type: Number },
    },

    estimatedArrival: { type: Date },

    progress: {
      type: [
        {
          status: { type: String },
          updatedAt: { type: Date, default: Date.now },
        },
      ],
      default: [{ status: "Pending", updatedAt: Date.now() }],
    },

    technicianAcceptedAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

// ✅ Auto-generate unique service order ID (#SORD10001, #SORD10002...)
serviceBookingSchema.pre("save", async function (next) {
  if (!this.serviceOrderId) {
    try {
      const lastOrder = await mongoose
        .model("CustomerService")
        .findOne({ serviceOrderId: { $exists: true } })
        .sort({ createdAt: -1 });

      let lastNumber = 10000;
      if (lastOrder && lastOrder.serviceOrderId) {
        const num = parseInt(lastOrder.serviceOrderId.replace("#SORD", ""));
        if (!isNaN(num)) lastNumber = num;
      }

      this.serviceOrderId = `#SORD${lastNumber + 1}`;
      next();
    } catch (err) {
      console.error("Error generating serviceOrderId:", err);
      next(err);
    }
  } else {
    next();
  }
});

const CustomerService = mongoose.model("CustomerService", serviceBookingSchema);

export default CustomerService;
