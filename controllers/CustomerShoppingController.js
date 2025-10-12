import CustomerShopping from "../models/CustomerShoppingModel.js";

// -------------------- CREATE ORDER --------------------
const createOrder = async (req, res) => {
  try {
    const { customerId, cartItems, address, payment } = req.body;

    if (!customerId || !cartItems || cartItems.length === 0 || !address || !payment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const order = new CustomerShopping({
      customerId,
      cartItems,
      address,
      payment,
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

// -------------------- UPDATE ORDER --------------------
// const updateOrder = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { cartItems, address, payment, orderStatus } = req.body;

//     const updatedOrder = await CustomerShopping.findByIdAndUpdate(
//       id,
//       { cartItems, address, payment, orderStatus },
//       { new: true }
//     );

//     if (!updatedOrder) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     res.status(200).json({
//       message: "Order updated successfully",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     console.error("Error updating order:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

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
  // updateOrder,
  deleteOrder,
};
  