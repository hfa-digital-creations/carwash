import CustomerService from "../models/serviceBookingModel.js";

// -------------------- CREATE SERVICE ORDER --------------------
const createServiceOrder = async (req, res) => {
  try {
    const { customerId, serviceItems, address, date, time, payment } = req.body;

    if (!customerId || !serviceItems || serviceItems.length === 0 || !address || !date || !time || !payment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newServiceOrder = new CustomerService({
      customerId,
      serviceItems,
      address,
      date,
      time,
      payment,
    });

    await newServiceOrder.save();

    res.status(201).json({
      message: "Service order created successfully",
      order: newServiceOrder,
    });
  } catch (error) {
    console.error("Error creating service order:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET ALL SERVICE ORDERS (ADMIN) --------------------
const getAllServiceOrders = async (req, res) => {
  try {
    const orders = await CustomerService.find().sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No service orders found" });
    }

    res.status(200).json({
      message: "All service orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching all service orders:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET SERVICE ORDERS BY CUSTOMER ID --------------------
const getServiceOrdersByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) return res.status(400).json({ message: "Customer ID is required" });

    const orders = await CustomerService.find({ customerId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No service orders found for this customer" });
    }

    res.status(200).json({
      message: "Service orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching service orders by customer:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- GET SINGLE SERVICE ORDER BY ID --------------------
const getServiceOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) return res.status(400).json({ message: "Order ID is required" });

    const order = await CustomerService.findById(orderId);

    if (!order) return res.status(404).json({ message: "Service order not found" });

    res.status(200).json({
      message: "Service order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching service order by ID:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- CANCEL SERVICE ORDER --------------------
const cancelServiceOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await CustomerService.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Service order not found" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    order.status = "Cancelled";
    order.cancelReason = reason || "Cancelled by user";
    order.cancelledAt = new Date();

    await order.save();

    res.status(200).json({
      message: "Service order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling service order:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// -------------------- UPDATE SERVICE ORDER --------------------
const updateServiceOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { serviceItems, address, date, time, payment, status } = req.body;

    const updatedOrder = await CustomerService.findByIdAndUpdate(
      orderId,
      { serviceItems, address, date, time, payment, status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Service order not found" });
    }

    res.status(200).json({
      message: "Service order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating service order:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- DELETE SERVICE ORDER --------------------
const deleteServiceOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await CustomerService.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Service order not found" });
    }

    res.status(200).json({
      message: "Service order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service order:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  createServiceOrder,
  getAllServiceOrders,
  getServiceOrdersByCustomer,
  getServiceOrderById,
  cancelServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
};
