import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: ["Car Wash", "Bike Wash"],
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
      // "Basic Car Wash", "Standard Car Wash", "Premium Car Wash"
    },
    description: {
      type: String,
      required: true,
    },
    features: [
      {
        type: String,
      },
    ],
    duration: {
      type: Number, // in minutes
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    expressServiceAvailable: {
      type: Boolean,
      default: true,
    },
    expressFee: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
serviceSchema.index({ serviceType: 1, isActive: 1 });
serviceSchema.index({ serviceName: 1 });

const Service = mongoose.model("Service", serviceSchema);

export default Service;