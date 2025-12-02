import DeliveryPersonSchedule from "../models/deliveryPersonScheduleModels.js";
import CustomerShopping from "../models/CustomerShoppingModel.js";
import WasherEmployee from "../models/washerEmpRegistrationModel.js";
import mongoose from "mongoose";

// ✅ Accept an order
const acceptOrder = async (req, res) => {
  try {
    const { customerShoppingId, deliveryPersonId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerShoppingId) || 
        !mongoose.Types.ObjectId.isValid(deliveryPersonId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // Check that the employee is a Delivery Person
    const employee = await WasherEmployee.findById(deliveryPersonId);
    if (!employee || employee.role !== "Delivery Person") {
      return res.status(400).json({ message: "Employee is not a Delivery Person" });
    }

    // 1️⃣ Create schedule for delivery person
    const schedule = await DeliveryPersonSchedule.create({
      deliveryPersonId,
      customerShoppingId,
      status: "On the Way",
    });

    // 2️⃣ Update order status and delivery details in CustomerShopping
    const updatedOrder = await CustomerShopping.findByIdAndUpdate(
      customerShoppingId,
      {
         orderStatus: "Confirmed",
        isDeliveryAccepted: true,
        deliveryPersonDetails: {
          deliveryPersonId: employee._id,
          fullName: employee.fullName,
          phone: employee.phone,
          avgRating: employee.avgRating || 0,
          vehicleType: employee.vehicle?.type || "N/A",
        },
         $push: { progress: { status: "Confirmed" } },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Order accepted and delivery person details updated",
      schedule,
      updatedOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ✅ Decline an order
const declineOrder = async (req, res) => {
  try {
    const { customerShoppingId, deliveryPersonId } = req.body;

    const schedule = await DeliveryPersonSchedule.create({
      deliveryPersonId,
      customerShoppingId,
      status: "Cancelled",
    });

    res.status(200).json({ message: "Order declined", schedule });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update status (On the Way / Picked Up / Completed / Cancelled)
const updateOrderStatus = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // 1️⃣ Update the schedule
    const updatedSchedule = await DeliveryPersonSchedule.findByIdAndUpdate(
      scheduleId,
      { status },
      { new: true }
    );

    if (!updatedSchedule) return res.status(404).json({ message: "Schedule not found" });

    // 2️⃣ Update the CustomerShopping order status as well
    const updatedOrder = await CustomerShopping.findByIdAndUpdate(
      updatedSchedule.customerShoppingId,
      { orderStatus: status ,
         $push: { progress: { status } },
       },
      { new: true }
    );

    res.status(200).json({
      message: "Status updated for both schedule and order",
      updatedSchedule,
      updatedOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get all schedules or schedules for a specific delivery person
const getAllSchedules = async (req, res) => {
  try {
    const { deliveryPersonId } = req.query;

    let filter = {};
    if (deliveryPersonId) {
      if (!mongoose.Types.ObjectId.isValid(deliveryPersonId)) {
        return res.status(400).json({ message: "Invalid deliveryPersonId" });
      }
      filter = { deliveryPersonId };
    }

    const schedules = await DeliveryPersonSchedule.find(filter)
      .populate({
        path: "customerShoppingId",
        select: "customerId cartItems address payment orderStatus",
      })
      .sort({ createdAt: -1 });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({ message: "No schedules found" });
    }

    // 🧮 Calculate order totals
    const result = schedules.map((schedule) => {
      const order = schedule.customerShoppingId;
      if (!order) return schedule;

      const cartTotal = order.cartItems.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );

      const totalAmount = order.payment?.amount || cartTotal;

      return {
        ...schedule.toObject(),
        orderSummary: {
          cartTotal,
          paymentAmount: totalAmount,
          orderStatus: order.orderStatus,
          address: order.address,
        },
      };
    });

    res.status(200).json({
      message: "Schedules fetched successfully",
      schedules: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete a schedule
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const deleted = await DeliveryPersonSchedule.findByIdAndDelete(scheduleId);
    if (!deleted) return res.status(404).json({ message: "Schedule not found" });

    res.status(200).json({ message: "Schedule deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default {
  acceptOrder,
  declineOrder,
  updateOrderStatus,
  getAllSchedules,
  deleteSchedule,
};
