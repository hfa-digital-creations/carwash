import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referrerName: { type: String, required: true },
    referrerType: {
      type: String,
      enum: ["Customer", "WasherEmployee", "RepairTechnician", "ProductSeller", "DeliveryPerson"],
      required: true,
    },
    referralCode: { type: String, required: true },

    referredUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referredUserName: { type: String, required: true },
    referredUserType: {
      type: String,
      enum: ["Customer", "WasherEmployee", "RepairTechnician", "ProductSeller", "DeliveryPerson"],
      required: true,
    },
    signupDate: { type: Date, default: Date.now },
    firstServiceBooked: { type: String, default: "N/A" },
    usedCode: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Referral", referralSchema);
 