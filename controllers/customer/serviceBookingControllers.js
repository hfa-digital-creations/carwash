import ServiceBooking from "../../models/serviceBookingModel.js";
import Partner from "../../models/partnerModel.js";
import Customer from "../../models/customerModels.js";
import Notification from "../../models/notificationModel.js";
import { Transaction, EarningsSummary } from "../../models/earningsModel.js";

// ==================== CUSTOMER: REQUEST SERVICE ====================
const requestService = async (req, res) => {
  try {
    const {
      customerId,
      service, // { serviceName, serviceImage, description, estimatedPrice }
      technicianId, // Customer can select technician from list
      isAtShop,
      shopName,
      shopAddress,
      shopLocation,
      serviceAddress,
      scheduledDate,
      scheduledTime,
      timeSlot,
      paymentMethod,
      estimatedTotal,
      advancePayment,
      customerNotes
    } = req.body;

    if (!customerId || !service || !technicianId || !scheduledDate || !scheduledTime || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const technician = await Partner.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    if (technician.role !== "Repair Service Technician") {
      return res.status(400).json({ message: "Selected partner is not a repair technician" });
    }

    if (!technician.isActive) {
      return res.status(400).json({ message: "Technician is not active" });
    }

    // ✅ Create service request with "Request Placed" status
    const newBooking = await ServiceBooking.create({
      customerId,
      customerName: customer.fullName,
      customerPhone: customer.phoneNumber,
      service,
      technicianId,
      technicianName: technician.fullName,
      technicianPhone: technician.phoneNumber,
      technicianPhoto: technician.profilePhoto,
      technicianRating: technician.avgRating,
      isAtShop,
      shopName: isAtShop ? shopName || technician.shopDetails.shopName : null,
      shopAddress: isAtShop ? shopAddress || technician.shopDetails.shopAddress : null,
      shopLocation: isAtShop ? shopLocation || technician.shopDetails.location : null,
      serviceAddress: !isAtShop ? serviceAddress : null,
      scheduledDate,
      scheduledTime,
      timeSlot,
      status: "Request Placed", // ✅ Waiting for technician to accept
      statusTimeline: [{
        status: "Request Placed",
        timestamp: new Date()
      }],
      paymentMethod,
      paymentStatus: "Pending",
      estimatedTotal,
      advancePayment: advancePayment || 0,
      customerNotes
    });

    // ✅ Notify customer
    await Notification.create({
      recipientId: customerId,
      recipientType: "Customer",
      type: "Service Request Placed",
      title: "Service Request Placed",
      message: `Your service request ${newBooking.requestId} has been sent to ${technician.fullName}`,
      relatedId: newBooking.requestId,
      relatedType: "ServiceBooking",
      priority: "High"
    });

    // ✅ Notify technician
    await Notification.create({
      recipientId: technicianId,
      recipientType: "Partner",
      type: "New Service Request",
      title: "New Service Request",
      message: `New ${service.serviceName} request from ${customer.fullName}. Please accept or decline.`,
      relatedId: newBooking.requestId,
      relatedType: "ServiceBooking",
      actionText: "View Request",
      priority: "High"
    });

    console.log(`✅ Service request created: ${newBooking.requestId} - Technician: ${technician.fullName}`);

    res.status(201).json({
      message: "Service request sent successfully! Waiting for technician confirmation.",
      booking: newBooking
    });

  } catch (error) {
    console.error("❌ Request service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: GET ALL PENDING REQUESTS ====================
const getPendingServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const requests = await ServiceBooking.find({ status: "Request Placed" })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("customerId", "fullName email phoneNumber")
      .populate("technicianId", "fullName phoneNumber profilePhoto");

    const count = await ServiceBooking.countDocuments({ status: "Request Placed" });

    res.status(200).json({
      message: "Pending service requests fetched",
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error("❌ Get pending requests error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: MANUALLY ASSIGN/REASSIGN TECHNICIAN ====================
const assignTechnicianToService = async (req, res) => {
  try {
    const { requestId, technicianId } = req.body;

    if (!requestId || !technicianId) {
      return res.status(400).json({ message: "Request ID and Technician ID required" });
    }

    const booking = await ServiceBooking.findById(requestId);
    if (!booking) {
      return res.status(404).json({ message: "Service request not found" });
    }

    const technician = await Partner.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    if (technician.role !== "Repair Service Technician") {
      return res.status(400).json({ message: "Selected partner is not a repair technician" });
    }

    if (!technician.isActive) {
      return res.status(400).json({ message: "Technician is not active" });
    }

    // ✅ Assign/reassign technician
    booking.technicianId = technicianId;
    booking.technicianName = technician.fullName;
    booking.technicianPhone = technician.phoneNumber;
    booking.technicianPhoto = technician.profilePhoto;
    booking.technicianRating = technician.avgRating;
    booking.statusTimeline.push({
      status: "Technician Assigned",
      timestamp: new Date()
    });
    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Technician Assigned",
      title: "Technician Assigned",
      message: `${technician.fullName} has been assigned to your service request`,
      relatedId: booking.requestId,
      relatedType: "ServiceBooking",
      priority: "High"
    });

    // ✅ Notify new technician
    await Notification.create({
      recipientId: technicianId,
      recipientType: "Partner",
      type: "New Service Request",
      title: "Service Request Assigned",
      message: `Service request ${booking.requestId} has been assigned to you. Please accept or decline.`,
      relatedId: booking.requestId,
      relatedType: "ServiceBooking",
      priority: "High"
    });

    console.log(`✅ Technician assigned: ${technician.fullName} → Request: ${booking.requestId}`);

    res.status(200).json({
      message: "Technician assigned successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Assign technician error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== TECHNICIAN: ACCEPT SERVICE REQUEST ====================
const acceptServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianNotes } = req.body;
    const technicianId = req.partner._id;

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (booking.technicianId.toString() !== technicianId.toString()) {
      return res.status(403).json({ message: "This request is not assigned to you" });
    }

    if (booking.status !== "Request Placed") {
      return res.status(400).json({ message: "Service request already processed" });
    }

    // ✅ Technician accepted
    booking.status = "Service Accepted";
    booking.statusTimeline.push({
      status: "Service Accepted",
      timestamp: new Date()
    });
    booking.technicianNotes = technicianNotes;
    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Service Accepted",
      title: "Service Request Accepted",
      message: `${booking.technicianName} has accepted your service request!`,
      relatedId: booking.requestId,
      relatedType: "ServiceBooking",
      priority: "High"
    });

    console.log(`✅ Service accepted by: ${booking.technicianName}`);

    res.status(200).json({
      message: "Service request accepted successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Accept service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== TECHNICIAN: DECLINE SERVICE REQUEST ====================
const declineServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const technicianId = req.partner._id;

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (booking.technicianId.toString() !== technicianId.toString()) {
      return res.status(403).json({ message: "This request is not assigned to you" });
    }

    // ✅ Technician declined - customer/admin needs to find another technician
    booking.technicianId = null;
    booking.technicianName = null;
    booking.technicianPhone = null;
    booking.technicianPhoto = null;
    booking.technicianRating = null;
    booking.statusTimeline.push({
      status: "Technician Declined",
      timestamp: new Date()
    });
    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Service Declined",
      title: "Technician Unavailable",
      message: `The technician is unavailable. Please select another technician or contact admin.`,
      relatedId: booking.requestId,
      relatedType: "ServiceBooking",
      priority: "High"
    });

    console.log(`⚠️ Service declined by technician. Reason: ${reason}`);

    res.status(200).json({
      message: "Service request declined",
      booking
    });

  } catch (error) {
    console.error("❌ Decline service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== TECHNICIAN: UPDATE SERVICE STATUS ====================
const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const technicianId = req.partner._id;

    const validStatuses = [
      "Service Ongoing",
      "Service Completed"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (booking.technicianId.toString() !== technicianId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;
    booking.statusTimeline.push({
      status,
      timestamp: new Date()
    });

    if (status === "Service Ongoing") {
      booking.startedAt = new Date();
    } else if (status === "Service Completed") {
      booking.completedAt = new Date();
      
      if (booking.startedAt) {
        const duration = Math.floor((booking.completedAt - booking.startedAt) / (1000 * 60));
        booking.duration = duration < 60 ? `${duration} minutes` : `${Math.floor(duration / 60)} hours ${duration % 60} minutes`;
      }
    }

    await booking.save();

    // Notify customer
    let notificationMessage = "";
    switch (status) {
      case "Service Ongoing":
        notificationMessage = "Your service is now in progress";
        break;
      case "Service Completed":
        notificationMessage = "Service completed! Please rate your experience";
        break;
    }

    if (notificationMessage) {
      await Notification.create({
        recipientId: booking.customerId,
        recipientType: "Customer",
        type: status,
        title: status,
        message: notificationMessage,
        relatedId: booking.requestId,
        relatedType: "ServiceBooking",
        priority: "High"
      });
    }

    console.log(`✅ Service status updated: ${booking.requestId} → ${status}`);

    res.status(200).json({
      message: "Service status updated successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Update service status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== TECHNICIAN: COMPLETE SERVICE (with photos & final price) ====================
const completeService = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualTotal, beforePhotos, afterPhotos, technicianNotes } = req.body;
    const technicianId = req.partner._id;

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (booking.technicianId.toString() !== technicianId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // ✅ Complete service
    booking.status = "Service Completed";
    booking.completedAt = new Date();
    booking.actualTotal = actualTotal;
    booking.beforePhotos = beforePhotos || [];
    booking.afterPhotos = afterPhotos || [];
    booking.technicianNotes = technicianNotes;
    booking.statusTimeline.push({
      status: "Service Completed",
      timestamp: new Date()
    });

    if (booking.startedAt) {
      const duration = Math.floor((booking.completedAt - booking.startedAt) / (1000 * 60));
      booking.duration = duration < 60 ? `${duration} minutes` : `${Math.floor(duration / 60)} hours ${duration % 60} minutes`;
    }

    await booking.save();

    // ✅ Create transaction for technician
    await Transaction.create({
      partnerId: booking.technicianId,
      partnerName: booking.technicianName,
      orderId: booking.requestId,
      orderType: "ServiceBooking",
      customerId: booking.customerId,
      customerName: booking.customerName,
      itemName: booking.service.serviceName,
      itemImage: booking.service.serviceImage,
      transactionType: "Earning",
      amount: actualTotal,
      commission: actualTotal * 0.15, // 15% commission
      serviceFee: 0,
      netAmount: actualTotal * 0.85,
      status: "Completed",
      completedAt: new Date(),
      paymentMethod: booking.paymentMethod
    });

    // Update earnings summary
    await updateEarningsSummary(booking.technicianId, actualTotal * 0.85, "Repair Services");

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Service Completed",
      title: "Service Completed",
      message: "Service completed successfully! Please rate your experience",
      relatedId: booking.requestId,
      relatedType: "ServiceBooking",
      priority: "High"
    });

    console.log(`✅ Service completed: ${booking.requestId} - Total: ₹${actualTotal}`);

    res.status(200).json({
      message: "Service completed successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Complete service error:", error);
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

// ==================== CANCEL SERVICE ====================
const cancelService = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelledBy } = req.body;

    const booking = await ServiceBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (booking.status === "Service Completed" || booking.status === "Cancelled") {
      return res.status(400).json({ message: `Service is already ${booking.status}` });
    }

    booking.status = "Cancelled";
    booking.cancellationReason = cancellationReason;
    booking.cancelledBy = cancelledBy;
    booking.cancellationDate = new Date();
    booking.statusTimeline.push({
      status: "Cancelled",
      timestamp: new Date()
    });
    await booking.save();

    // Notify relevant parties
    if (cancelledBy === "Customer" && booking.technicianId) {
      await Notification.create({
        recipientId: booking.technicianId,
        recipientType: "Partner",
        type: "Service Cancelled",
        title: "Service Cancelled",
        message: `Customer cancelled service request ${booking.requestId}`,
        relatedId: booking.requestId,
        relatedType: "ServiceBooking"
      });
    } else if (cancelledBy === "Technician") {
      await Notification.create({
        recipientId: booking.customerId,
        recipientType: "Customer",
        type: "Service Cancelled",
        title: "Service Cancelled",
        message: `Your service request ${booking.requestId} has been cancelled by technician`,
        relatedId: booking.requestId,
        relatedType: "ServiceBooking"
      });
    }

    res.status(200).json({
      message: "Service cancelled successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Cancel service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET CUSTOMER'S SERVICE REQUESTS ====================
const getMyServiceRequests = async (req, res) => {
  try {
    const customerId = req.user._id;

    const bookings = await ServiceBooking.find({ customerId })
      .sort({ createdAt: -1 })
      .populate("technicianId", "fullName phoneNumber profilePhoto avgRating");

    res.status(200).json({
      message: "Service requests fetched",
      bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error("❌ Get my service requests error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET TECHNICIAN'S SERVICE REQUESTS ====================
const getTechnicianServiceRequests = async (req, res) => {
  try {
    const technicianId = req.partner._id;
    const { status } = req.query;

    let filter = { technicianId };
    if (status) filter.status = status;

    const bookings = await ServiceBooking.find(filter)
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .populate("customerId", "fullName phoneNumber");

    res.status(200).json({
      message: "Service requests fetched",
      bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error("❌ Get technician service requests error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: GET ALL SERVICE REQUESTS ====================
const getAllServiceRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const requests = await ServiceBooking.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("customerId", "fullName email phoneNumber")
      .populate("technicianId", "fullName phoneNumber profilePhoto");

    const count = await ServiceBooking.countDocuments(filter);

    res.status(200).json({
      message: "All service requests fetched",
      requests,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error("❌ Get all service requests error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET SERVICE BY ID ====================
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await ServiceBooking.findById(id)
      .populate("customerId", "fullName email phoneNumber")
      .populate("technicianId", "fullName phoneNumber profilePhoto avgRating");

    if (!booking) {
      return res.status(404).json({ message: "Service request not found" });
    }

    res.status(200).json({
      message: "Service details fetched",
      booking
    });

  } catch (error) {
    console.error("❌ Get service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  // Customer
  requestService,
  getMyServiceRequests,
  
  // Admin
  getPendingServiceRequests,
  assignTechnicianToService,
  getAllServiceRequests,
  
  // Technician
  acceptServiceRequest,
  declineServiceRequest,
  updateServiceStatus,
  completeService,
  getTechnicianServiceRequests,
  
  // Common
  getServiceById,
  cancelService
};