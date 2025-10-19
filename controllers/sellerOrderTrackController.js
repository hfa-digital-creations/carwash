import mongoose from "mongoose";
import SellerOrderTrack from "../models/SellerOrderTrackModel.js";
import CustomerShopping from "../models/CustomerShoppingModel.js";
import WasherEmployee from "../models/washerEmpRegistrationModel.js";

// -------------------- ACCEPT ORDER --------------------
const acceptSellerOrder = async (req, res) => {
  try {
    const {
      sellerId,
      customerShoppingId,
      deliveryPersonId,
      estimatedDelivery,
      customerName,
      customerPhone,
    } = req.body;

    // Validate required fields
    if (!sellerId || !customerShoppingId || !deliveryPersonId)
      return res.status(400).json({ message: "Missing required fields" });

    if (
      !mongoose.Types.ObjectId.isValid(sellerId) ||
      !mongoose.Types.ObjectId.isValid(customerShoppingId) ||
      !mongoose.Types.ObjectId.isValid(deliveryPersonId)
    )
      return res.status(400).json({ message: "Invalid IDs" });

    // Fetch customer order
    const order = await CustomerShopping.findById(customerShoppingId).populate(
      "cartItems.productId"
    );
    if (!order)
      return res.status(404).json({ message: "Customer order not found" });

    // Fetch delivery partner
    const deliveryPerson = await WasherEmployee.findById(deliveryPersonId);
    if (!deliveryPerson || deliveryPerson.role !== "Delivery Person") {
      return res.status(400).json({ message: "Invalid delivery partner" });
    }

    // Prepare product snapshot
    const products = order.cartItems.map((item) => ({
      productId: item.productId?._id,
      productImage: item.productImage || item.productId?.productImage,
      productTitle: item.productTitle || item.productId?.productTitle,
      productDescription:
        item.productDescription || item.productId?.productDescription,
      unitPrice: item.unitPrice || item.productId?.unitPrice,
      stockQuantity: item.stockQuantity || item.productId?.stockQuantity,
      quantityOrdered: item.quantity,
      total: item.total,
    }));

    // Create seller order track document
    const sellerTrack = await SellerOrderTrack.create({
      sellerId,
      customerShoppingId,
      customer: {
        customerId: order.customerId,
        name: customerName || "Unknown",
        phone: customerPhone || "",
        address: order.address,
      },
      products,
      deliveryPartner: {
        deliveryPersonId,
        name: deliveryPerson.fullName,
        phone: deliveryPerson.phoneNumber,
        vehicle: {
          type: deliveryPerson.vehicleType,
          license: deliveryPerson.vehicleLicense,
        },
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      },
      status: "Accepted",
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      remarks: "Order accepted by seller",
      updatedBy: "Seller",
    });

    // Update main customer shopping order
    await CustomerShopping.findByIdAndUpdate(customerShoppingId, {
      orderStatus: "Accepted",
    });

    res
      .status(201)
      .json({ message: "Seller order accepted successfully", sellerTrack });
  } catch (err) {
    console.error("ACCEPT ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- UPDATE STATUS --------------------
const updateSellerOrderStatus = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { status, remarks, deliveryPersonId, estimatedDelivery } = req.body;

    if (!mongoose.Types.ObjectId.isValid(trackId))
      return res.status(400).json({ message: "Invalid track ID" });

    const updateData = {
      status,
      remarks,
      updatedAt: new Date(),
      updatedBy: "Seller",
    };

    // If delivery info updates
    if (deliveryPersonId) {
      const deliveryPerson = await WasherEmployee.findById(deliveryPersonId);
      if (!deliveryPerson)
        return res.status(400).json({ message: "Invalid delivery partner" });

      updateData.deliveryPartner = {
        deliveryPersonId,
        name: deliveryPerson.fullName,
        phone: deliveryPerson.phoneNumber,
        vehicle: {
          type: deliveryPerson.vehicleType,
          license: deliveryPerson.vehicleLicense,
        },
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      };
    }

    const updatedTrack = await SellerOrderTrack.findByIdAndUpdate(
      trackId,
      updateData,
      { new: true }
    );

    if (!updatedTrack)
      return res.status(404).json({ message: "Seller order track not found" });

    // Sync status to main CustomerShopping order
    await CustomerShopping.findByIdAndUpdate(updatedTrack.customerShoppingId, {
      orderStatus: status,
    });

    res
      .status(200)
      .json({ message: "Order status updated successfully", updatedTrack });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- GET SELLER ORDERS --------------------
const getSellerOrders = async (req, res) => {
  try {
    const { sellerId } = req.query;
    const filter = sellerId ? { sellerId } : {};

    const orders = await SellerOrderTrack.find(filter)
      .populate({
        path: "customerShoppingId",
        select: "customerId cartItems address payment orderStatus subtotal",
      })
      .populate({
        path: "customer.customerId",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 });

    if (!orders.length)
      return res.status(404).json({ message: "No orders found" });

    res.status(200).json({ message: "Seller orders fetched", orders });
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- DELETE SELLER ORDER TRACK --------------------
const deleteSellerTrack = async (req, res) => {
  try {
    const { trackId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(trackId))
      return res.status(400).json({ message: "Invalid track ID" });

    const deletedTrack = await SellerOrderTrack.findByIdAndDelete(trackId);
    if (!deletedTrack)
      return res
        .status(404)
        .json({ message: "Seller order track not found or already deleted" });

    res
      .status(200)
      .json({ message: "Seller order track deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default {
  acceptSellerOrder,
  updateSellerOrderStatus,
  getSellerOrders,
  deleteSellerTrack,
};
