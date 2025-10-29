import mongoose from "mongoose";
import RepairTechnicianSchedule from "../models/repairTechnicianScheduleModel.js";
import CustomerService from "../models/serviceBookingModel.js";
import RepairTechnician from "../models/repairTechnicianModel.js";
  
// ✅ Accept a service request (Only one technician can accept)
const acceptService = async (req, res) => {
  try {
    const { customerServiceId, repairTechnicianId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(customerServiceId) ||
      !mongoose.Types.ObjectId.isValid(repairTechnicianId)
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // ✅ Find the service booking
    const service = await CustomerService.findById(customerServiceId);
    if (!service) {
      return res.status(404).json({ message: "Service booking not found" });
    }

    // ✅ Prevent multiple acceptance
    if (service.isTechnicianAccepted) {
      return res.status(400).json({
        message: "This service booking has already been accepted by another technician ❌",
      });
    }

    // ✅ Check if technician is valid
    const technician = await RepairTechnician.findById(repairTechnicianId);
    if (!technician || technician.role !== "Repair Service Technician") {
      return res.status(400).json({ message: "User is not a valid Repair Technician" });
    }

    // ✅ Create new schedule for technician
    const schedule = await RepairTechnicianSchedule.create({
      repairTechnicianId,
      customerServiceId,
      status: "On the Way",
      progress: ["On the Way"],
    });

    // ✅ Update the customer service booking
    service.serviceStatus = "On the Way";
    service.isTechnicianAccepted = true;
    service.technicianDetails = {
      technicianId: technician._id,
      fullName: technician.fullName,
      phone: technician.phoneNumber,
      avgRating: technician.rating || 0,
    };

    // ✅ Add progress update
    service.progress.push({ status: "Confirmed", updatedAt: new Date() });

    await service.save();

    res.status(200).json({
      message: "Service accepted successfully ✅",
      schedule,
      updatedService: service,
    });
  } catch (err) {
    console.error("Error in acceptService:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
;



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

    const validStatuses = ["On the Way", "Processing", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
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
      {
        serviceStatus: status,
        $push: { progress: { status, updatedAt: new Date() } },
      },
      { new: true }
    );

    res.status(200).json({
      message: "Status & progress updated successfully ✅",
      updatedSchedule,
      updatedService,
    });
  } catch (err) {
    console.error("Error updating service status:", err);
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
