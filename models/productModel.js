import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true }, // just a string
    productTitle: { type: String, required: true, trim: true },
    productDescription: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    productImage: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);




// import mongoose from "mongoose";

// // Product snapshot schema (matches your Product model)
// const productItemSchema = new mongoose.Schema({
//   productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//   productImage: { type: String, required: true },
//   productTitle: { type: String, required: true, trim: true },
//   productDescription: { type: String, required: true, trim: true },
//   unitPrice: { type: Number, required: true, min: 0 },
//   stockQuantity: { type: Number, required: true, min: 0 },
//   quantityOrdered: { type: Number, required: true, min: 1 }, // quantity in this order
//   total: { type: Number, required: true }, // unitPrice * quantityOrdered
// });

// const sellerOrderTrackSchema = new mongoose.Schema(
//   {
//     sellerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Seller",
//       required: true,
//     },
//     customerShoppingId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "CustomerShopping",
//       required: true,
//     },
//     // ✅ Customer snapshot
//     customer: {
//       name: { type: String },
//       address: { type: String },
//       phone: { type: String },
//     },
//     // ✅ Full product details
//     products: [productItemSchema],
//     // ✅ Delivery partner details
//     deliveryPartner: {
//       deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee" },
//       name: { type: String },
//       vehicle: {
//         type: String,
//         license: String,
//       },
//       estimatedDelivery: Date,
//     },
//     status: {
//       type: String,
//       enum: [
//         "Pending",
//         "Accepted",
//         "Packed",
//         "Dispatched",
//         "Delivering",
//         "Delivered",
//         "Cancelled",
//       ],
//       default: "Pending",
//     },
//     remarks: { type: String, default: "" },
//     updatedBy: { type: String, default: "Seller" },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("SellerOrderTrack", sellerOrderTrackSchema);
