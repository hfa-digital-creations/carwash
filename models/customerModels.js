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
    
    // Admin control
    isActive: { type: Boolean, default: false } // false by default, admin can activate
  },
  { timestamps: true }
);

const Customer = mongoose.model("User", customerSchema);
export default Customer;
