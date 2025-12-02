import mongoose from "mongoose";

const assignOrderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    serviceType: {
      type: String,
      enum: ["Washing", "Delivery", "Repair"],
      required: true,
    },
    orderDate: {
      type: Date,
      required: true,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "employeeModel", // dynamic reference based on employee type
    },
    employeeModel: {
      type: String,
      enum: ["WasherEmployee", "RepairTechnician", "DeliveryPartner"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const AssignOrder = mongoose.model("AssignOrder", assignOrderSchema);

export default AssignOrder;
