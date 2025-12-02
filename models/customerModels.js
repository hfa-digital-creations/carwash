import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: String, // or ObjectId if you want to link to another customer
      default: null,
    },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🔥 Generate referral code before saving
customerSchema.pre("save", function (next) {
  if (!this.referralCode) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.referralCode = code; // Example: "X8B2K9"
  }
  next();
});

const Customer = mongoose.model("User", customerSchema);
export default Customer;
