import ProductOrder from "../../models/productOrderModel.js";
import Partner from "../../models/partnerModel.js";
import Customer from "../../models/customerModels.js";
import Notification from "../../models/notificationModel.js";
import { Transaction, EarningsSummary } from "../../models/earningsModel.js";

// ==================== CUSTOMER: CREATE ORDER ====================
const createProductOrder = async (req, res) => {
  try {
    const {
      customerId,
      items, // [{ productId, sellerId, productTitle, productImage, unitPrice, quantity }]
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCharges,
      discount,
      couponCode,
      total
    } = req.body;

    if (!customerId || !items || items.length === 0 || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Process items and get seller details
    const processedItems = await Promise.all(
      items.map(async (item) => {
        const seller = await Partner.findById(item.sellerId);
        return {
          productId: item.productId,
          sellerId: item.sellerId,
          sellerName: seller ? seller.fullName : "Unknown Seller",
          productImage: item.productImage,
          productTitle: item.productTitle,
          productDescription: item.productDescription,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity
        };
      })
    );

    // ✅ Create order with "Pending" status (waiting for seller confirmation)
    const newOrder = await ProductOrder.create({
      customerId,
      customerName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phoneNumber,
      items: processedItems,
      shippingAddress,
      orderStatus: "Pending", // ✅ Waiting for seller/admin confirmation
      statusTimeline: [{
        status: "Pending",
        timestamp: new Date(),
        note: "Order placed, waiting for seller confirmation"
      }],
      paymentMethod,
      paymentStatus: "Pending",
      subtotal,
      shippingCharges: shippingCharges || 0,
      discount: discount || 0,
      couponCode,
      total,
    });

    // ✅ Notify customer
    await Notification.create({
      recipientId: customerId,
      recipientType: "Customer",
      type: "Order Placed",
      title: "Order Placed Successfully",
      message: `Your order ${newOrder.orderId} has been placed and is waiting for seller confirmation`,
      relatedId: newOrder.orderId,
      relatedType: "ProductOrder",
      priority: "High"
    });

    // ✅ Notify all sellers
    const uniqueSellers = [...new Set(items.map(item => item.sellerId))];
    for (const sellerId of uniqueSellers) {
      await Notification.create({
        recipientId: sellerId,
        recipientType: "Partner",
        type: "New Order Received",
        title: "New Order Received",
        message: `New order ${newOrder.orderId} received. Please confirm.`,
        relatedId: newOrder.orderId,
        relatedType: "ProductOrder",
        priority: "High"
      });
    }

    console.log(`✅ Order created: ${newOrder.orderId} - Status: Pending`);

    res.status(201).json({
      message: "Order created successfully! Waiting for seller confirmation.",
      order: newOrder
    });

  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN/SELLER: CONFIRM ORDER ====================
const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "Pending") {
      return res.status(400).json({ message: "Order is not in pending status" });
    }

    // ✅ Update status to Confirmed
    order.orderStatus = "Confirmed";
    order.statusTimeline.push({
      status: "Confirmed",
      timestamp: new Date(),
      note: "Order confirmed by seller"
    });
    await order.save();

    // Notify customer
    await Notification.create({
      recipientId: order.customerId,
      recipientType: "Customer",
      type: "Order Confirmed",
      title: "Order Confirmed",
      message: `Your order ${order.orderId} has been confirmed by the seller!`,
      relatedId: order.orderId,
      relatedType: "ProductOrder",
      priority: "High"
    });

    console.log(`✅ Order confirmed: ${order.orderId}`);

    res.status(200).json({
      message: "Order confirmed successfully",
      order
    });

  } catch (error) {
    console.error("❌ Confirm order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: ASSIGN DELIVERY PARTNER ====================
const assignDeliveryPartner = async (req, res) => {
  try {
    const { orderId, deliveryPartnerId } = req.body;

    if (!orderId || !deliveryPartnerId) {
      return res.status(400).json({ message: "Order ID and Delivery Partner ID required" });
    }

    const order = await ProductOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "Confirmed" && order.orderStatus !== "Processing" && order.orderStatus !== "Shipped") {
      return res.status(400).json({ message: "Order must be confirmed/processing/shipped before assigning delivery partner" });
    }

    const deliveryPartner = await Partner.findById(deliveryPartnerId);
    if (!deliveryPartner) {
      return res.status(404).json({ message: "Delivery partner not found" });
    }

    if (deliveryPartner.role !== "Delivery Person") {
      return res.status(400).json({ message: "Selected partner is not a delivery person" });
    }

    if (!deliveryPartner.isActive) {
      return res.status(400).json({ message: "Delivery partner is not active" });
    }

    // ✅ Assign delivery partner
    order.deliveryPartnerId = deliveryPartnerId;
    order.deliveryPartnerName = deliveryPartner.fullName;
    order.deliveryPartnerPhone = deliveryPartner.phoneNumber;
    order.orderStatus = "Out for Delivery";
    order.statusTimeline.push({
      status: "Out for Delivery",
      timestamp: new Date(),
      note: `Assigned to ${deliveryPartner.fullName}`
    });
    await order.save();

    // Notify customer
    await Notification.create({
      recipientId: order.customerId,
      recipientType: "Customer",
      type: "Out for Delivery",
      title: "Order Out for Delivery",
      message: `Your order is out for delivery with ${deliveryPartner.fullName}`,
      relatedId: order.orderId,
      relatedType: "ProductOrder",
      priority: "High"
    });

    // ✅ Notify delivery partner
    await Notification.create({
      recipientId: deliveryPartnerId,
      recipientType: "Partner",
      type: "New Order Received",
      title: "New Delivery Assigned",
      message: `New delivery order ${order.orderId} assigned to you`,
      relatedId: order.orderId,
      relatedType: "ProductOrder",
      priority: "High"
    });

    console.log(`✅ Delivery partner assigned: ${deliveryPartner.fullName} → Order: ${order.orderId}`);

    res.status(200).json({
      message: "Delivery partner assigned successfully",
      order
    });

  } catch (error) {
    console.error("❌ Assign delivery partner error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== DELIVERY PARTNER: ACCEPT DELIVERY ====================
const acceptDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner._id;

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryPartnerId.toString() !== partnerId.toString()) {
      return res.status(403).json({ message: "This delivery is not assigned to you" });
    }

    order.statusTimeline.push({
      status: "Delivery Accepted",
      timestamp: new Date()
    });
    await order.save();

    // Notify customer
    await Notification.create({
      recipientId: order.customerId,
      recipientType: "Customer",
      type: "Delivery Accepted",
      title: "Delivery Partner on the Way",
      message: `${order.deliveryPartnerName} has accepted your delivery!`,
      relatedId: order.orderId,
      relatedType: "ProductOrder",
      priority: "High"
    });

    console.log(`✅ Delivery accepted by: ${order.deliveryPartnerName}`);

    res.status(200).json({
      message: "Delivery accepted successfully",
      order
    });

  } catch (error) {
    console.error("❌ Accept delivery error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== DELIVERY PARTNER: DECLINE DELIVERY ====================
const declineDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const partnerId = req.partner._id;

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryPartnerId.toString() !== partnerId.toString()) {
      return res.status(403).json({ message: "This delivery is not assigned to you" });
    }

    // ✅ Delivery declined - admin needs to assign another partner
    order.deliveryPartnerId = null;
    order.deliveryPartnerName = null;
    order.deliveryPartnerPhone = null;
    order.orderStatus = "Shipped"; // Back to shipped status
    order.statusTimeline.push({
      status: "Delivery Declined",
      timestamp: new Date(),
      note: reason
    });
    await order.save();

    console.log(`⚠️ Delivery declined. Reason: ${reason}`);

    res.status(200).json({
      message: "Delivery declined. Admin will assign another partner.",
      order
    });

  } catch (error) {
    console.error("❌ Decline delivery error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== UPDATE ORDER STATUS ====================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Processing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      timestamp: new Date(),
      note
    });

    if (status === "Delivered") {
      order.actualDeliveryDate = new Date();
      
      // ✅ Create transactions for sellers
      for (const item of order.items) {
        await Transaction.create({
          partnerId: item.sellerId,
          partnerName: item.sellerName,
          orderId: order.orderId,
          orderType: "ProductOrder",
          customerId: order.customerId,
          customerName: order.customerName,
          itemName: item.productTitle,
          itemImage: item.productImage,
          transactionType: "Earning",
          amount: item.subtotal,
          commission: item.subtotal * 0.1, // 10% commission
          serviceFee: 0,
          netAmount: item.subtotal * 0.9,
          status: "Completed",
          completedAt: new Date(),
          paymentMethod: order.paymentMethod
        });

        // Update seller's earnings
        await updateEarningsSummary(item.sellerId, item.subtotal * 0.9, "Shopping");
      }

      // ✅ Create transaction for delivery partner
      if (order.deliveryPartnerId) {
        const deliveryFee = order.shippingCharges || 50;
        await Transaction.create({
          partnerId: order.deliveryPartnerId,
          partnerName: order.deliveryPartnerName,
          orderId: order.orderId,
          orderType: "ProductOrder",
          customerId: order.customerId,
          customerName: order.customerName,
          itemName: "Delivery Service",
          transactionType: "Earning",
          amount: deliveryFee,
          commission: 0,
          serviceFee: 0,
          netAmount: deliveryFee,
          status: "Completed",
          completedAt: new Date(),
          paymentMethod: order.paymentMethod
        });

        await updateEarningsSummary(order.deliveryPartnerId, deliveryFee, "Shopping");
      }
    }

    await order.save();

    // Notify customer
    let notificationMessage = "";
    switch (status) {
      case "Confirmed":
        notificationMessage = "Your order has been confirmed by the seller";
        break;
      case "Processing":
        notificationMessage = "Your order is being prepared";
        break;
      case "Shipped":
        notificationMessage = "Your order has been shipped";
        break;
      case "Out for Delivery":
        notificationMessage = "Your order is out for delivery";
        break;
      case "Delivered":
        notificationMessage = "Your order has been delivered! Please rate your experience";
        break;
    }

    if (notificationMessage) {
      await Notification.create({
        recipientId: order.customerId,
        recipientType: "Customer",
        type: status,
        title: status,
        message: notificationMessage,
        relatedId: order.orderId,
        relatedType: "ProductOrder",
        priority: "High"
      });
    }

    console.log(`✅ Order status updated: ${order.orderId} → ${status}`);

    res.status(200).json({
      message: "Order status updated successfully",
      order
    });

  } catch (error) {
    console.error("❌ Update order status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== HELPER: Update Earnings Summary ====================
const updateEarningsSummary = async (partnerId, amount, orderType) => {
  try {
    let summary = await EarningsSummary.findOne({ partnerId });

    if (!summary) {
      summary = await EarningsSummary.create({ partnerId });
    }

    summary.totalEarnings += amount;
    summary.totalBookings += 1;
    summary.currentBalance += amount;
    summary.pendingAmount += amount;
    summary.thisWeek.earnings += amount;
    summary.thisWeek.bookings += 1;
    summary.thisMonth.earnings += amount;
    summary.thisMonth.bookings += 1;

    if (summary.earningsByType[orderType] !== undefined) {
      summary.earningsByType[orderType] += amount;
    }

    await summary.save();
  } catch (error) {
    console.error("Update earnings summary error:", error);
  }
};

// ==================== GET SELLER'S ORDERS ====================
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.partner._id;
    const { status } = req.query;

    let filter = { "items.sellerId": sellerId };
    if (status) filter.orderStatus = status;

    const orders = await ProductOrder.find(filter)
      .sort({ createdAt: -1 })
      .populate("customerId", "fullName phoneNumber");

    res.status(200).json({
      message: "Seller orders fetched",
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error("❌ Get seller orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET DELIVERY PARTNER'S ORDERS ====================
const getDeliveryPartnerOrders = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const orders = await ProductOrder.find({
      deliveryPartnerId: partnerId,
      orderStatus: { $in: ["Out for Delivery", "Delivered"] }
    })
      .sort({ createdAt: -1 })
      .populate("customerId", "fullName phoneNumber");

    res.status(200).json({
      message: "Delivery orders fetched",
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error("❌ Get delivery orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET CUSTOMER'S ORDERS ====================
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user._id;

    const orders = await ProductOrder.find({ customerId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Orders fetched",
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error("❌ Get my orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: GET ALL ORDERS ====================
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) filter.orderStatus = status;

    const orders = await ProductOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("customerId", "fullName email phoneNumber");

    const count = await ProductOrder.countDocuments(filter);

    res.status(200).json({
      message: "All orders fetched",
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error("❌ Get all orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET ORDER BY ID ====================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await ProductOrder.findById(id)
      .populate("customerId", "fullName email phoneNumber")
      .populate("deliveryPartnerId", "fullName phoneNumber");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order details fetched",
      order
    });

  } catch (error) {
    console.error("❌ Get order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== CANCEL ORDER ====================
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelledBy } = req.body;

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus === "Delivered" || order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: `Order is already ${order.orderStatus}` });
    }

    order.orderStatus = "Cancelled";
    order.cancellationReason = cancellationReason;
    order.cancelledBy = cancelledBy;
    order.cancellationDate = new Date();
    order.statusTimeline.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: cancellationReason
    });
    await order.save();

    // Notify relevant parties
    if (cancelledBy === "Customer") {
      const uniqueSellers = [...new Set(order.items.map(item => item.sellerId))];
      for (const sellerId of uniqueSellers) {
        await Notification.create({
          recipientId: sellerId,
          recipientType: "Partner",
          type: "Order Cancelled",
          title: "Order Cancelled",
          message: `Customer cancelled order ${order.orderId}`,
          relatedId: order.orderId,
          relatedType: "ProductOrder"
        });
      }
    }

    res.status(200).json({
      message: "Order cancelled successfully",
      order
    });

  } catch (error) {
    console.error("❌ Cancel order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  // Customer
  createProductOrder,
  getMyOrders,
  
  // Admin/Seller
  confirmOrder,
  assignDeliveryPartner,
  updateOrderStatus,
  getAllOrders,
  
  // Seller (Product Seller)
  getSellerOrders,
  
  // Delivery Partner
  acceptDelivery,
  declineDelivery,
  getDeliveryPartnerOrders,
  
  // Common
  getOrderById,
  cancelOrder
};