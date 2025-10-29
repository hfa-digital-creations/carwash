import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    // who is the referrer
    referrerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referrerName: { type: String, required: true },
    referrerType: {
      type: String,
      enum: ["Customer", "WasherEmployee", "RepairTechnician", "ProductSeller", "DeliveryPerson"],
      required: true,
    },
    referralCode: { type: String, required: true },

    // who was referred
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

    // admin control
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ReferralDetail", referralSchema);
