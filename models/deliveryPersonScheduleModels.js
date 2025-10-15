import mongoose from "mongoose";

const deliveryPersonScheduleSchema = new mongoose.Schema(
  {
       deliveryPersonId : { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee", required: true },
   
    customerShoppingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerShopping",
      required: true,
    },
    status: {
      type: String,
      enum: ["On the Way", "Item Picked Up", "Completed", "Cancelled"],
      default: "On the Way",
    },
  },
  { timestamps: true } // createdAt & updatedAt
);

// Optional: populate customerShopping details when fetching schedules
deliveryPersonScheduleSchema.pre(/^find/, function (next) {
  this.populate({
    path: "customerShoppingId",
    select: "customerId cartItems address payment orderStatus",
  });
  next();
});

export default mongoose.model(
  "DeliveryPersonSchedule",
  deliveryPersonScheduleSchema
);
