import mongoose from "mongoose";

const repairTechnicianScheduleSchema = new mongoose.Schema(
  {
    // Linked technician (who performs the service)
    repairTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RepairTechnician",
      required: true,
    },

    // Linked customer service booking
    customerServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerService",
      required: true,
    },

    // Status of the service process
    status: {
      type: String,
      enum: [
        "On the Way",
        "Service Started",
        "Completed",
        "Cancelled"
      ],
      default: "On the Way",
    },
  },
  { timestamps: true } // createdAt & updatedAt
);

// ✅ Automatically populate related booking details when fetching schedules
repairTechnicianScheduleSchema.pre(/^find/, function (next) {
  this.populate({
    path: "customerServiceId",
    select:
      "customerId vehicleType vehicleModel serviceName minPrice maxPrice address distance orderId orderDate bookingDate bookingTime totalAmount contactNumber",
  }).populate({
    path: "repairTechnicianId",
    select: "fullName phoneNumber email services yearsOfExperience shopDetails",
  });
  next();
});

export default mongoose.model(
  "RepairTechnicianSchedule",
  repairTechnicianScheduleSchema
);
