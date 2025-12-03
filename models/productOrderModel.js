import mongoose from "mongoose";

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
  sellerName: { type: String },
  productImage: { type: String },
  productTitle: { type: String, required: true },
  productDescription: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true } // unitPrice * quantity
}, { _id: false });

// Shipping Address Schema
const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  unit: { type: String },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  }
}, { _id: false });

// Status Timeline Schema
const statusTimelineSchema = new mongoose.Schema({
  status: { type: String },
  timestamp: { type: Date, default: Date.now },
  note: { type: String }
}, { _id: false });

// Product Order Schema
const productOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    default: () => "ORD" + Math.floor(100000 + Math.random() * 900000)
  },
  
  // Customer Details
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String },
  customerEmail: { type: String },
  customerPhone: { type: String },
  
  // Order Items (Multiple sellers possible)
  items: [orderItemSchema],
  
  // Shipping Address
  shippingAddress: shippingAddressSchema,
  
  // Delivery Partner (Assigned by Admin)
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
  deliveryPartnerName: { type: String },
  deliveryPartnerPhone: { type: String },
  
  // Status Tracking
  orderStatus: {
    type: String,
    enum: [
      "Pending", // Waiting for seller confirmation
      "Confirmed", // Seller confirmed
      "Processing", // Being prepared
      "Shipped", // Shipped by seller
      "Out for Delivery", // Assigned to delivery partner
      "Delivery Accepted", // Delivery partner accepted
      "Delivery Declined", // Delivery partner declined
      "Delivered", // Successfully delivered
      "Cancelled",
      "Returned"
    ],
    default: "Pending"
  },
  statusTimeline: [statusTimelineSchema],
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ["UPI", "Debit Card", "Credit Card", "Net Banking", "Wallet Balance"],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending"
  },
  
  // Pricing
  subtotal: { type: Number, required: true },
  shippingCharges: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: { type: String },
  total: { type: Number, required: true },
  
  // Delivery Tracking
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  trackingNumber: { type: String },
  
  // Rating & Review
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  
  // Cancellation/Return
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ["Customer", "Seller", "Admin"] },
  cancellationDate: { type: Date },
  returnReason: { type: String },
  returnDate: { type: Date }
  
}, { timestamps: true });

// Create indexes
productOrderSchema.index({ "items.sellerId": 1 });
productOrderSchema.index({ deliveryPartnerId: 1 });
productOrderSchema.index({ "shippingAddress.location": "2dsphere" });

const ProductOrder = mongoose.model("ProductOrder", productOrderSchema);
export default ProductOrder;