import Booking from "../../models/bookingModel.js";
import Partner from "../../models/partnerModel.js";
import Customer from "../../models/customerModels.js";
import { Voucher, VoucherUsage } from "../../models/voucherModel.js";
import Notification from "../../models/notificationModel.js";
import { Transaction, EarningsSummary } from "../../models/earningsModel.js";
import QRCode from "qrcode";

// ==================== CUSTOMER: CREATE BOOKING ====================
const createBooking = async (req, res) => {
  try {
    const {
      customerId,
      serviceType, // "Car Wash" | "Bike Wash"
      vehicleType, // "Car" | "Bike"
      vehicleModel,
      vehicleNumber,
      package: packageData,
      address,
      scheduledDate,
      scheduledTime,
      timeSlot,
      paymentMethod,
      subtotal,
      expressFee,
      discount,
      couponCode,
      total,
      advancePayment,
      specialInstructions
    } = req.body;

    if (!customerId || !serviceType || !vehicleType || !packageData || !address || !scheduledDate || !scheduledTime || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Apply voucher if provided
    let finalDiscount = discount || 0;
    if (couponCode) {
      const voucher = await Voucher.findOne({
        code: couponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (voucher && (voucher.applicableFor.includes(serviceType) || voucher.applicableFor.includes("All"))) {
        if (subtotal >= voucher.minOrderValue) {
          if (voucher.discountType === "Percentage") {
            finalDiscount = (subtotal * voucher.discountValue) / 100;
            if (voucher.maxDiscount) finalDiscount = Math.min(finalDiscount, voucher.maxDiscount);
          } else {
            finalDiscount = voucher.discountValue;
          }
          voucher.usedCount += 1;
          await voucher.save();
        }
      }
    }

    const finalTotal = subtotal + (expressFee || 0) - finalDiscount;

    // Generate QR Code
    const qrData = {
      bookingId: "#" + Math.floor(100000 + Math.random() * 900000),
      customerId,
      customerName: customer.fullName,
      serviceType,
      scheduledDate,
      scheduledTime
    };
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

    // ✅ Create booking with "Pending" status (waiting for admin approval)
    const newBooking = await Booking.create({
      customerId,
      customerName: customer.fullName,
      customerPhone: customer.phoneNumber,
      serviceType,
      vehicleType,
      vehicleModel,
      vehicleNumber,
      package: packageData,
      address,
      scheduledDate,
      scheduledTime,
      timeSlot,
      paymentMethod,
      paymentStatus: advancePayment ? "Paid" : "Pending",
      subtotal,
      expressFee: expressFee || 0,
      discount: finalDiscount,
      couponCode,
      total: finalTotal,
      advancePayment: advancePayment || 0,
      advancePaid: advancePayment ? true : false,
      specialInstructions,
      qrCode: qrCodeDataURL,
      status: "Pending", // ✅ Waiting for admin approval
      statusTimeline: [{
        status: "Pending",
        timestamp: new Date()
      }]
    });

    // Create voucher usage record
    if (couponCode) {
      await VoucherUsage.create({
        voucherId: voucher._id,
        voucherCode: couponCode,
        userId: customerId,
        orderId: newBooking.bookingId,
        orderType: "Booking",
        discountApplied: finalDiscount
      });
    }

    // ✅ Notify customer
    await Notification.create({
      recipientId: customerId,
      recipientType: "Customer",
      type: "Booking Confirmed",
      title: "Booking Received",
      message: `Your ${serviceType} booking ${newBooking.bookingId} is received and waiting for admin approval!`,
      relatedId: newBooking.bookingId,
      relatedType: "Booking",
      priority: "High"
    });

    console.log(`✅ New booking created: ${newBooking.bookingId} - Status: Pending (Admin approval needed)`);

    res.status(201).json({
      message: "Booking created successfully! Waiting for admin approval.",
      booking: newBooking
    });

  } catch (error) {
    console.error("❌ Create booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: GET ALL PENDING BOOKINGS ====================
const getPendingBookings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const bookings = await Booking.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("customerId", "fullName email phoneNumber");

    const count = await Booking.countDocuments({ status: "Pending" });

    res.status(200).json({
      message: "Pending bookings fetched",
      bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error("❌ Get pending bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: APPROVE BOOKING ====================
const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "Pending") {
      return res.status(400).json({ message: "Booking is not in pending status" });
    }

    // ✅ Update status to Confirmed (but no partner assigned yet)
    booking.status = "Confirmed";
    booking.statusTimeline.push({
      status: "Confirmed",
      timestamp: new Date()
    });
    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Booking Confirmed",
      title: "Booking Approved",
      message: `Your booking ${booking.bookingId} has been approved by admin!`,
      relatedId: booking.bookingId,
      relatedType: "Booking",
      priority: "High"
    });

    console.log(`✅ Booking approved: ${booking.bookingId} - Status: Confirmed`);

    res.status(200).json({
      message: "Booking approved successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Approve booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: MANUALLY ASSIGN PARTNER ====================
const assignPartnerToBooking = async (req, res) => {
  try {
    const { bookingId, partnerId } = req.body;

    if (!bookingId || !partnerId) {
      return res.status(400).json({ message: "Booking ID and Partner ID required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "Pending") {
      return res.status(400).json({ message: "Please approve the booking first" });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if partner is active and has correct role
    if (!partner.isActive) {
      return res.status(400).json({ message: "Partner is not active" });
    }

    if (partner.role !== "Washing Personnel" && partner.role !== "Delivery Person") {
      return res.status(400).json({ message: "Partner must be Washing Personnel or Delivery Person" });
    }

    // ✅ Assign partner (status remains "Confirmed" until partner accepts)
    booking.partnerId = partnerId;
    booking.partnerName = partner.fullName;
    booking.partnerPhone = partner.phoneNumber;
    booking.partnerPhoto = partner.profilePhoto;
    booking.partnerRating = partner.avgRating;
    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Partner Assigned",
      title: "Partner Assigned",
      message: `${partner.fullName} has been assigned to your booking`,
      relatedId: booking.bookingId,
      relatedType: "Booking",
      priority: "High"
    });

    // ✅ Notify partner (they need to accept/decline)
    await Notification.create({
      recipientId: partnerId,
      recipientType: "Partner",
      type: "New Booking Request",
      title: "New Booking Assigned",
      message: `New ${booking.serviceType} booking ${booking.bookingId} assigned to you. Please accept or decline.`,
      relatedId: booking.bookingId,
      relatedType: "Booking",
      actionText: "View Details",
      priority: "High"
    });

    console.log(`✅ Partner assigned: ${partner.fullName} → Booking: ${booking.bookingId}`);

    res.status(200).json({
      message: "Partner assigned successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Assign partner error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== PARTNER: ACCEPT BOOKING ====================
const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner._id; // From middleware

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.partnerId.toString() !== partnerId.toString()) {
      return res.status(403).json({ message: "This booking is not assigned to you" });
    }

    if (booking.status !== "Confirmed") {
      return res.status(400).json({ message: "Booking cannot be accepted in current status" });
    }

    // ✅ Partner accepted - now can start working
    booking.statusTimeline.push({
      status: "Partner Accepted",
      timestamp: new Date()
    });
    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Partner Accepted",
      title: "Booking Accepted",
      message: `${booking.partnerName} has accepted your booking!`,
      relatedId: booking.bookingId,
      relatedType: "Booking",
      priority: "High"
    });

    console.log(`✅ Booking accepted by partner: ${booking.partnerName}`);

    res.status(200).json({
      message: "Booking accepted successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Accept booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== PARTNER: DECLINE BOOKING ====================
const declineBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const partnerId = req.partner._id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.partnerId.toString() !== partnerId.toString()) {
      return res.status(403).json({ message: "This booking is not assigned to you" });
    }

    // ✅ Partner declined - admin needs to assign another partner
    booking.partnerId = null;
    booking.partnerName = null;
    booking.partnerPhone = null;
    booking.partnerPhoto = null;
    booking.partnerRating = null;
    booking.statusTimeline.push({
      status: "Partner Declined",
      timestamp: new Date()
    });
    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Partner Declined",
      title: "Partner Unavailable",
      message: `The assigned partner is unavailable. Admin will assign a new partner shortly.`,
      relatedId: booking.bookingId,
      relatedType: "Booking",
      priority: "High"
    });

    console.log(`⚠️ Booking declined by partner. Reason: ${reason}`);

    res.status(200).json({
      message: "Booking declined. Admin will assign another partner.",
      booking
    });

  } catch (error) {
    console.error("❌ Decline booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== PARTNER: UPDATE STATUS (On The Way, Arrived, etc.) ====================
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedArrival } = req.body;
    const partnerId = req.partner._id;

    const validStatuses = [
      "Washer On The Way",
      "Washer Arrived",
      "Washing in Progress",
      "Completed"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.partnerId.toString() !== partnerId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;
    booking.statusTimeline.push({
      status,
      timestamp: new Date()
    });

    if (estimatedArrival) {
      booking.estimatedArrival = estimatedArrival;
    }

    await booking.save();

    // Create notification
    let notificationMessage = "";
    switch (status) {
      case "Washer On The Way":
        notificationMessage = `${booking.partnerName} is on the way! ${estimatedArrival ? `ETA: ${estimatedArrival}` : ""}`;
        break;
      case "Washer Arrived":
        notificationMessage = `${booking.partnerName} has arrived at your location`;
        break;
      case "Washing in Progress":
        notificationMessage = "Washing is now in progress";
        break;
      case "Completed":
        notificationMessage = "Service completed! Please rate your experience";
        
        // ✅ Create transaction for partner
        await Transaction.create({
          partnerId: booking.partnerId,
          partnerName: booking.partnerName,
          orderId: booking.bookingId,
          orderType: "Booking",
          customerId: booking.customerId,
          customerName: booking.customerName,
          itemName: `${booking.serviceType} - ${booking.package.packageType}`,
          transactionType: "Earning",
          amount: booking.total,
          commission: booking.total * 0.15, // 15% commission
          serviceFee: 0,
          netAmount: booking.total * 0.85,
          status: "Completed",
          completedAt: new Date(),
          paymentMethod: booking.paymentMethod,
          location: {
            city: booking.address.city,
            area: booking.address.street
          }
        });

        // Update earnings summary
        await updateEarningsSummary(booking.partnerId, booking.total * 0.85, "Booking");
        
        break;
    }

    if (notificationMessage) {
      await Notification.create({
        recipientId: booking.customerId,
        recipientType: "Customer",
        type: status,
        title: status,
        message: notificationMessage,
        relatedId: booking.bookingId,
        relatedType: "Booking",
        priority: "High"
      });
    }

    console.log(`✅ Booking status updated: ${booking.bookingId} → ${status}`);

    res.status(200).json({
      message: "Status updated successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Update status error:", error);
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

// ==================== GET PARTNER'S SCHEDULED JOBS ====================
const getPartnerScheduledJobs = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const jobs = await Booking.find({
      partnerId,
      status: { $in: ["Confirmed", "Washer On The Way", "Washer Arrived", "Washing in Progress"] }
    })
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .populate("customerId", "fullName phoneNumber");

    res.status(200).json({
      message: "Scheduled jobs fetched",
      jobs,
      count: jobs.length
    });

  } catch (error) {
    console.error("❌ Get scheduled jobs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET CUSTOMER'S BOOKINGS ====================
const getMyBookings = async (req, res) => {
  try {
    const customerId = req.user._id; // From customer middleware

    const bookings = await Booking.find({ customerId })
      .sort({ createdAt: -1 })
      .populate("partnerId", "fullName phoneNumber profilePhoto avgRating");

    res.status(200).json({
      message: "Bookings fetched",
      bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error("❌ Get my bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== ADMIN: GET ALL BOOKINGS ====================
const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("customerId", "fullName email phoneNumber")
      .populate("partnerId", "fullName phoneNumber profilePhoto");

    const count = await Booking.countDocuments(filter);

    res.status(200).json({
      message: "All bookings fetched",
      bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error("❌ Get all bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET BOOKING BY ID ====================
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("customerId", "fullName email phoneNumber")
      .populate("partnerId", "fullName phoneNumber profilePhoto avgRating");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking details fetched",
      booking
    });

  } catch (error) {
    console.error("❌ Get booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== CANCEL BOOKING ====================
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason, cancelledBy } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "Completed" || booking.status === "Cancelled") {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
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
    if (cancelledBy === "Customer" && booking.partnerId) {
      await Notification.create({
        recipientId: booking.partnerId,
        recipientType: "Partner",
        type: "Booking Cancelled",
        title: "Booking Cancelled",
        message: `Customer cancelled booking ${booking.bookingId}`,
        relatedId: booking.bookingId,
        relatedType: "Booking"
      });
    } else if (cancelledBy === "Partner") {
      await Notification.create({
        recipientId: booking.customerId,
        recipientType: "Customer",
        type: "Booking Cancelled",
        title: "Booking Cancelled",
        message: `Your booking ${booking.bookingId} has been cancelled`,
        relatedId: booking.bookingId,
        relatedType: "Booking"
      });
    }

    res.status(200).json({
      message: "Booking cancelled successfully",
      booking
    });

  } catch (error) {
    console.error("❌ Cancel booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  // Customer
  createBooking,
  getMyBookings,
  
  // Admin
  getPendingBookings,
  approveBooking,
  assignPartnerToBooking,
  getAllBookings,
  
  // Partner
  acceptBooking,
  declineBooking,
  updateBookingStatus,
  getPartnerScheduledJobs,
  
  // Common
  getBookingById,
  cancelBooking
};