import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

    serviceItems: [
      {
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceItem", required: true },
        productImage: { type: String }, // URL or path of the image
        productName: { type: String, required: true },
        description: { type: String },
        serviceCharges: { type: Number, required: true }, // like 500-2000
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
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
      },
    },

    date: { type: Date, required: true },
    time: { type: String, required: true }, // "HH:mm" format

    payment: {
      method: { type: String, required: true },
      transactionId: { type: String },
      amount: { type: Number, required: true },
      status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
    },

    serviceStatus: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const CustomerService = mongoose.model("CustomerService", serviceBookingSchema);

export default CustomerService;
