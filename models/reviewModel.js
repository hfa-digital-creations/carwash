import mongoose from "mongoose";
import Partner from "./partnerModel.js";

// Review Schema
const reviewSchema = new mongoose.Schema({
  // Customer Details
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String },
  customerPhoto: { type: String },
  
  // Partner Details
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
  partnerName: { type: String },
  partnerRole: { type: String }, // "Washing Personnel", "Repair Service Technician", etc.
  
  // Order/Booking Reference
  orderId: { type: String, required: true }, // bookingId, orderId, or requestId
  orderType: {
    type: String,
    enum: ["Booking", "ProductOrder", "ServiceBooking"],
    required: true
  },
  
  // Review Details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: { type: String },
  images: [{ type: String }], // Array of review image URLs
  
  // Partner Response
  responseText: { type: String },
  respondedAt: { type: Date },
  
  // Visibility
  isVisible: { type: Boolean, default: true }, // Admin can hide inappropriate reviews
  
  // Helpful Count (optional feature)
  helpfulCount: { type: Number, default: 0 }
  
}, { timestamps: true });

// Indexes
reviewSchema.index({ partnerId: 1, isVisible: 1 });
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ orderId: 1 }, { unique: true }); // One review per order

// Post-save hook to update partner's average rating
reviewSchema.post("save", async function() {
  try {
    const partner = await Partner.findById(this.partnerId);
    if (partner) {
      // Calculate average rating
      const reviews = await Review.find({ partnerId: this.partnerId, isVisible: true });
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      partner.avgRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
      partner.ratingCount = reviews.length;
      await partner.save();
    }
  } catch (error) {
    console.error("Error updating partner rating:", error);
  }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;