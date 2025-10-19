import mongoose from "mongoose";
import RepairTechnicianSchedule from "../models/repairTechnicianScheduleModel.js";
import CustomerService from "../models/serviceBookingModel.js";
import RepairTechnician from "../models/repairTechnicianModel.js";

// ✅ Accept a service request
const acceptService = async (req, res) => {
  try {
    const { customerServiceId, repairTechnicianId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(customerServiceId) ||
      !mongoose.Types.ObjectId.isValid(repairTechnicianId)
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // ✅ Check that the person is a repair technician
    const technician = await RepairTechnician.findById(repairTechnicianId);
    if (!technician || technician.role !== "Repair Service Technician") {
      return res.status(400).json({ message: "User is not a Repair Technician" });
    }

    // 1️⃣ Create schedule for technician
    const schedule = await RepairTechnicianSchedule.create({
      repairTechnicianId,
      customerServiceId,
      status: "On the Way",
    });

    // 2️⃣ Update service request status
    const updatedService = await CustomerService.findByIdAndUpdate(
      customerServiceId,
      { serviceStatus: "On the Way" },
      { new: true }
    );

    res.status(200).json({
      message: "Service accepted and status updated",
      schedule,
      updatedService,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// ✅ Decline a service
const declineService = async (req, res) => {
  try {
    const { customerServiceId, repairTechnicianId } = req.body;

    const schedule = await RepairTechnicianSchedule.create({
      repairTechnicianId,
      customerServiceId,
      status: "Cancelled",
    });

    res.status(200).json({ message: "Service declined", schedule });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Update status (On the Way / Service Started / Completed / Cancelled)
const updateServiceStatus = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const updatedSchedule = await RepairTechnicianSchedule.findByIdAndUpdate(
      scheduleId,
      { status },
      { new: true }
    );

    if (!updatedSchedule)
      return res.status(404).json({ message: "Schedule not found" });

    const updatedService = await CustomerService.findByIdAndUpdate(
      updatedSchedule.customerServiceId,
      { serviceStatus: status },
      { new: true }
    );

    res.status(200).json({
      message: "Status updated successfully",
      updatedSchedule,
      updatedService,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get all schedules or schedules for a specific technician
const getAllSchedules = async (req, res) => {
  try {
    const { repairTechnicianId } = req.query;
    let filter = {};

    if (repairTechnicianId) {
      if (!mongoose.Types.ObjectId.isValid(repairTechnicianId)) {
        return res.status(400).json({ message: "Invalid repairTechnicianId" });
      }
      filter = { repairTechnicianId };
    }

    const schedules = await RepairTechnicianSchedule.find(filter)
      .populate({
        path: "customerServiceId",
        select: "customerId serviceType date time address totalAmount serviceStatus",
      })
      .sort({ createdAt: -1 });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({ message: "No schedules found" });
    }

    res.status(200).json({
      message: "Schedules fetched successfully",
      schedules,
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

    const deleted = await RepairTechnicianSchedule.findByIdAndDelete(scheduleId);
    if (!deleted)
      return res.status(404).json({ message: "Schedule not found" });

    res.status(200).json({ message: "Schedule deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default {
  acceptService,
  declineService,
  updateServiceStatus,
  getAllSchedules,
  deleteSchedule,
};
