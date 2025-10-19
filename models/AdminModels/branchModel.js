import mongoose from "mongoose";

// Sub-Admin Schema
const subAdminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true, // admin can activate/deactivate sub-admin
  },
}, { _id: false }); // prevent separate _id for subAdmin

// Branch Schema
const branchSchema = new mongoose.Schema({
  branchName: {
    type: String,
    required: true,
  },
  branchAddress: {
    type: String,
    required: true,
  },
  subAdmin: {
    type: subAdminSchema,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true, // admin can activate/deactivate branch
  }
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
