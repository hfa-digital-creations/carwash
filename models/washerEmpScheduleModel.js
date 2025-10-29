import mongoose from "mongoose";

const washerEmpScheduleSchema = new mongoose.Schema(
  {
    washerEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee", required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    status: {
      type: String,
      enum: [,"On the Way", "Started","Washing In Progress", "Completed", "Declined"],
      default: "On the Way",
    },
     progress: { type: [String], default: ["On the Way"] }
  },
  { timestamps: true } // ✅ This is correct
);

export default mongoose.model("WasherEmpSchedule", washerEmpScheduleSchema);
