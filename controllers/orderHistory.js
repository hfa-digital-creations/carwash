// // orderHistory.controller.js

// const Order = require('../models/order.model');
// const User = require('../models/user.model');

// /**
//  * Get order history for a user
//  * GET /api/orders/history/:userId
//  */
// exports.getOrderHistory = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { page = 1, limit = 10, status } = req.query;

//     // Build query
//     const query = { userId };
//     if (status) {
//       query.status = status;
//     }

//     // Fetch orders with pagination
//     const orders = await Order.find(query)
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .populate('washer', 'name rating profileImage')
//       .exec();

//     // Get total count
//     const count = await Order.countDocuments(query);

//     res.status(200).json({
//       success: true,
//       data: orders,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       totalOrders: count
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching order history',
//       error: error.message
//     });
//   }
// };

// /**
//  * Get single order details
//  * GET /api/orders/:orderId
//  */
// exports.getOrderDetails = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .populate('washer', 'name rating profileImage phone')
//       .populate('vehicleId', 'make model')
//       .exec();

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: order
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching order details',
//       error: error.message
//     });
//   }
// };

// /**
//  * Get order tracking/progress
//  * GET /api/orders/:orderId/tracking
//  */
// exports.getOrderTracking = async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     const order = await Order.findById(orderId)
//       .select('status progress washer estimatedArrival location')
//       .populate('washer', 'name currentLocation')
//       .exec();

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         orderId: order._id,
//         status: order.status,
//         progress: order.progress,
//         washer: order.washer,
//         estimatedArrival: order.estimatedArrival,
//         location: order.location
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching order tracking',
//       error: error.message
//     });
//   }
// };

// /**
//  * Cancel an order
//  * PUT /api/orders/:orderId/cancel
//  */
// exports.cancelOrder = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { reason } = req.body;

//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // Check if order can be cancelled
//     if (['Completed', 'Cancelled'].includes(order.status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot cancel this order'
//       });
//     }

//     order.status = 'Cancelled';
//     order.cancellationReason = reason;
//     order.cancelledAt = new Date();
    
//     await order.save();

//     res.status(200).json({
//       success: true,
//       message: 'Order cancelled successfully',
//       data: order
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error cancelling order',
//       error: error.message
//     });
//   }
// };

// /**
//  * Rate and review order
//  * POST /api/orders/:orderId/review
//  */
// exports.addReview = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { rating, comment } = req.body;

//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     if (order.status !== 'Completed') {
//       return res.status(400).json({
//         success: false,
//         message: 'Can only review completed orders'
//       });
//     }

//     order.rating = rating;
//     order.review = comment;
//     order.reviewedAt = new Date();

//     await order.save();

//     // Update washer's average rating
//     await updateWasherRating(order.washer, rating);

//     res.status(200).json({
//       success: true,
//       message: 'Review added successfully',
//       data: order
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error adding review',
//       error: error.message
//     });
//   }
// };

// // Helper function to update washer rating
// async function updateWasherRating(washerId, newRating) {
//   const orders = await Order.find({ 
//     washer: washerId, 
//     rating: { $exists: true } 
//   });
  
//   const totalRating = orders.reduce((sum, order) => sum + order.rating, 0);
//   const avgRating = totalRating / orders.length;
  
//   await User.findByIdAndUpdate(washerId, { rating: avgRating });
// }