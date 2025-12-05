import mongoose from "mongoose";

// Notification Schema
const notificationSchema = new mongoose.Schema({
  // Recipient Details
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientType: {
    type: String,
    enum: ["Customer", "Partner", "Admin"],
    required: true
  },
  
  // Notification Content
  type: {
    type: String,
    enum: [
      // Customer notifications - Booking
      "Booking Confirmed",
      "Partner Assigned",
      "Partner Accepted",
      "Partner Declined",
      "Washer On The Way",
      "Washer Arrived",
      "Washing in Progress",
      "Completed",
      "Cancelled",
      
      // Customer notifications - Orders
      "Order Placed",
      "Order Confirmed",
      "Order Processing",
      "Order Shipped",
      "Out for Delivery",
      "Order Delivered",
      "Delivery Accepted",
      "Delivery Declined",
      "Order Cancelled",
      
      // Customer notifications - Service
      "Service Request Placed",
      "Technician Assigned",
      "Service Accepted",
      "Service Declined",
      "Service Ongoing",
      "Service Completed",
      "Service Cancelled",
      
      // Partner notifications
      "New Booking Request",
      "New Service Request",
      "New Order Received",
      "Payment Received",
      "New Review Received",
      "Booking Reassigned",
      "Order Reassigned",
      "Service Reassigned",
      
      // General
      "Payment Reminder",
      "Promotional",
      "Alert",
      "Reminder"
    ],
    required: true
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Related Entity
  relatedId: { type: String }, // bookingId, orderId, requestId
  relatedType: { type: String }, // "Booking", "ProductOrder", "ServiceBooking"
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Priority
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  
  // Action
  actionText: { type: String }, // "View Booking", "Accept", "Decline"
  actionUrl: { type: String }, // Deep link URL
  
  // Additional Data
  imageUrl: { type: String },
  data: { type: mongoose.Schema.Types.Mixed } // Extra data in JSON format
  
}, { timestamps: true });

// Indexes
notificationSchema.index({ recipientId: 1, recipientType: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;