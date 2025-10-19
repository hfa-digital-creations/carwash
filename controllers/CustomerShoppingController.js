import CustomerShopping from "../models/CustomerShoppingModel.js";
import Customer from "../models/customerModels.js";
import mongoose from "mongoose";

// -------------------- CREATE ORDER --------------------
const createOrder = async (req, res) => {
  try {
    const { customerId, cartItems, address, payment } = req.body;

    if (!customerId || !cartItems || cartItems.length === 0 || !address || !payment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔹 1️⃣ Fetch customer details
    const customer = await Customer.findById(customerId).select("fullName email phoneNumber");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // 🔹 2️⃣ Calculate subtotal & prepare cart items
    let subtotal = 0;
    const processedCartItems = cartItems.map((item) => {
      const total = item.unitPrice * item.quantity;
      subtotal += total;
      return {
        productId: item.productId,
        productTitle: item.productTitle,
        productDescription: item.productDescription,
        unitPrice: item.unitPrice,
        stockQuantity: item.stockQuantity || 0,
        productImage: item.productImage || "",
        quantity: item.quantity,
        total,
      };
    });

    // 🔹 3️⃣ Prepare payment details
    const orderPayment = {
      ...payment,
      amount: payment.amount || subtotal,
    };

    // 🔹 4️⃣ Embed customer snapshot inside the order
    const order = new CustomerShopping({
      customerId,
      customerDetails: {
        name: customer.fullName,
        email: customer.email,
        phone: customer.phoneNumber,
      },
      cartItems: processedCartItems,
      subtotal,
      address,
      payment: orderPayment,
      orderStatus: "Pending",
    });

    await order.save();

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// -------------------- GET ALL ORDERS --------------------
const getAllOrders = async (req, res) => {
  try {
    const orders = await CustomerShopping.find().sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json({
      message: "All orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET ORDER BY ID --------------------
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await CustomerShopping.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET ORDERS BY CUSTOMER --------------------
const getOrderedItems = async (req, res) => {
  try {
    const { customerId } = req.params;

    const orders = await CustomerShopping.find({ customerId }).sort({ createdAt: -1 });
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this customer" });
    }

    res.status(200).json({
      message: "Customer orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- CANCEL ORDER --------------------
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await CustomerShopping.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: "Order already cancelled" });
    }

    order.orderStatus = "Cancelled";
    order.cancelReason = req.body.reason || "Cancelled by user";
    order.cancelledAt = new Date();

    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully ✅",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- DELETE ORDER --------------------
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await CustomerShopping.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderedItems,
  cancelOrder,
  deleteOrder,
};
