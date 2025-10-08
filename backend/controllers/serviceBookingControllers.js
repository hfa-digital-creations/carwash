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

// -------------------- GET ALL SERVICE ORDERS FOR CUSTOMER --------------------
 const getServiceOrders = async (req, res) => {
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
    console.error("Error fetching service orders:", error.message);
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
    console.error("Error fetching service order:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
    createServiceOrder,
    getServiceOrders,
    getServiceOrderById
}
