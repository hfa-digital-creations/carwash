import Booking from "../../models/bookingModel.js";
import Service from "../../models/AdminModels/serviceModel.js";
import Partner from "../../models/partnerModel.js";
import Customer from "../../models/customerModels.js";
import { Voucher, VoucherUsage } from "../../models/voucherModel.js";
import Notification from "../../models/notificationModel.js";
import { Transaction, EarningsSummary } from "../../models/earningsModel.js";
import QRCode from "qrcode";

// ==================== STEP 1: GET AVAILABLE SERVICES ====================
const getAvailableServices = async (req, res) => {
  try {
    const { serviceType } = req.query;

    if (!serviceType || !["Car Wash", "Bike Wash"].includes(serviceType)) {
      return res.status(400).json({ message: "Valid serviceType required" });
    }

    const services = await Service.find({
      serviceType,
      isActive: true,
    }).sort({ price: 1 });

    res.status(200).json({
      message: `${serviceType} services fetched`,
      serviceType,
      services,
      count: services.length,
    });
  } catch (error) {
    console.error("❌ Get services error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== STEP 2: CALCULATE BOOKING COST ====================
const calculateBookingCost = async (req, res) => {
  try {
    const { serviceId, expressService, couponCode } = req.body;

    if (!serviceId) {
      return res.status(400).json({ message: "serviceId required" });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: "Service not found or inactive" });
    }

    let subtotal = service.price;
    let expressFee = 0;
    let discount = 0;

    if (expressService && service.expressServiceAvailable) {
      expressFee = service.expressFee || 0;
    }

    if (couponCode) {
      const voucher = await Voucher.findOne({
        code: couponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });

      if (voucher) {
        if (
          voucher.applicableFor.includes(service.serviceType) ||
          voucher.applicableFor.includes("All")
        ) {
          if (subtotal >= voucher.minOrderValue) {
            if (voucher.discountType === "Percentage") {
              discount = (subtotal * voucher.discountValue) / 100;
              if (voucher.maxDiscount) {
                discount = Math.min(discount, voucher.maxDiscount);
              }
            } else {
              discount = voucher.discountValue;
            }
          }
        }
      }
    }

    const total = subtotal + expressFee - discount;
    const advancePaymentRequired = Math.round(total * 0.30);

    res.status(200).json({
      message: "Cost calculated",
      service: {
        id: service._id,
        name: service.serviceName,
        type: service.serviceType,
        price: service.price,
        duration: service.duration,
      },
      pricing: {
        subtotal,
        expressFee,
        discount,
        total,
        advancePaymentRequired,
        balancePayment: total - advancePaymentRequired,
      },
      expressService: expressService && service.expressServiceAvailable,
      showDateTime: !expressService, // ✅ Show date/time when express is FALSE
    });
  } catch (error) {
    console.error("❌ Calculate cost error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== STEP 3: CREATE BOOKING (UPDATED) ====================
const createBooking = async (req, res) => {
  try {
    const {
      customerId,
      serviceId,
      vehicleType,
      vehicleNumber,
      address,
      liveLocation, // ✅ NEW: Live location
      expressService,
      scheduledDate,
      scheduledTime,
      timeSlot,
      specialInstructions,
    } = req.body;

    // ❌ vehicleModel removed

    if (!customerId || !serviceId || !vehicleType || !address) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: "Service not found or inactive" });
    }

    if (expressService && !service.expressServiceAvailable) {
      return res.status(400).json({
        message: "Express service not available for this package",
      });
    }

    // ✅ NEW LOGIC: If express is FALSE, date/time REQUIRED
    if (!expressService) {
      if (!scheduledDate || !scheduledTime) {
        return res.status(400).json({
          message: "Date and time required for regular booking",
        });
      }
    }

    // ✅ If express is TRUE, date/time OPTIONAL (can skip)
    // No validation needed - they can provide or not

    let subtotal = service.price;
    let expressFee = 0;

    if (expressService && service.expressServiceAvailable) {
      expressFee = service.expressFee || 0;
    }

    const total = subtotal + expressFee;
    const requiredAdvance = Math.round(total * 0.30);

    const qrData = {
      bookingId: "#" + Math.floor(100000 + Math.random() * 900000),
      customerId,
      customerName: customer.fullName,
      serviceType: service.serviceType,
      serviceName: service.serviceName,
      scheduledDate: scheduledDate || "Not scheduled",
      scheduledTime: scheduledTime || "Not scheduled",
    };
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

    const newBooking = await Booking.create({
      customerId,
      customerName: customer.fullName,
      customerPhone: customer.phoneNumber,
      serviceId: service._id,
      serviceType: service.serviceType,
      serviceName: service.serviceName,
      vehicleType,
      vehicleNumber,
      // ❌ vehicleModel removed
      package: {
        packageType: service.serviceName,
        services: service.features || [],
        price: service.price,
        expressEnabled: expressService || false,
      },
      address,
      liveLocation: liveLocation || null, // ✅ NEW: Live location
      expressService: expressService || false,
      scheduledDate: scheduledDate || null, // ✅ Can be null for express
      scheduledTime: scheduledTime || null, // ✅ Can be null for express
      timeSlot: timeSlot || null,
      paymentStatus: "Pending",
      subtotal,
      expressFee,
      discount: 0,
      couponCode: null,
      total,
      advancePayment: 0,
      balancePayment: total,
      advancePaid: false,
      specialInstructions,
      qrCode: qrCodeDataURL,
      status: "Pending",
      statusTimeline: [
        {
          status: "Pending",
          timestamp: new Date(),
        },
      ],
    });

    console.log(`✅ Booking created: ${newBooking.bookingId}`);
    console.log(`   Express Service: ${expressService ? "YES (date/time optional)" : "NO (date/time required)"}`);

    res.status(201).json({
      message: "Booking created! Please complete payment.",
      booking: {
        bookingId: newBooking.bookingId,
        _id: newBooking._id,
        serviceType: service.serviceType,
        serviceName: service.serviceName,
        vehicleType: newBooking.vehicleType,
        vehicleNumber: newBooking.vehicleNumber,
        // ❌ vehicleModel removed
        address: newBooking.address, // ✅ Added
        liveLocation: newBooking.liveLocation, // ✅ Added
        scheduledDate: newBooking.scheduledDate,
        scheduledTime: newBooking.scheduledTime,
        expressService: newBooking.expressService, // ✅ Added
        status: newBooking.status,
        paymentStatus: newBooking.paymentStatus,
        pricing: {
          subtotal,
          expressFee,
          discount: 0,
          total,
          advanceRequired: requiredAdvance,
          balanceDue: total - requiredAdvance,
        },
        qrCode: newBooking.qrCode,
        createdAt: newBooking.createdAt,
      },
      nextStep: {
        action: "Complete payment",
        endpoint: `/api/booking/${newBooking._id}/pay-advance`,
        amount: requiredAdvance,
      },
    });
  } catch (error) {
    console.error("❌ Create booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== STEP 4: MAKE ADVANCE PAYMENT ====================
const makeAdvancePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod,
      advancePayment,
      couponCode,
    } = req.body;

    if (!paymentMethod || !advancePayment) {
      return res.status(400).json({
        message: "Payment method and advance payment amount required",
      });
    }

    const booking = await Booking.findById(id).populate("serviceId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.advancePaid) {
      return res.status(400).json({
        message: "Advance payment already completed",
      });
    }

    if (booking.status !== "Pending") {
      return res.status(400).json({
        message: `Cannot make payment. Booking status: ${booking.status}`,
      });
    }

    let discount = 0;
    let voucherDoc = null;

    if (couponCode) {
      voucherDoc = await Voucher.findOne({
        code: couponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });

      if (!voucherDoc) {
        return res.status(400).json({
          message: "Invalid or expired coupon code",
        });
      }

      if (
        !voucherDoc.applicableFor.includes(booking.serviceType) &&
        !voucherDoc.applicableFor.includes("All")
      ) {
        return res.status(400).json({
          message: `Coupon not applicable for ${booking.serviceType}`,
        });
      }

      if (booking.subtotal < voucherDoc.minOrderValue) {
        return res.status(400).json({
          message: `Minimum order value of ₹${voucherDoc.minOrderValue} required for this coupon`,
        });
      }

      if (voucherDoc.discountType === "Percentage") {
        discount = (booking.subtotal * voucherDoc.discountValue) / 100;
        if (voucherDoc.maxDiscount) {
          discount = Math.min(discount, voucherDoc.maxDiscount);
        }
      } else {
        discount = voucherDoc.discountValue;
      }

      voucherDoc.usedCount += 1;
      await voucherDoc.save();

      await VoucherUsage.create({
        voucherId: voucherDoc._id,
        voucherCode: couponCode,
        userId: booking.customerId,
        orderId: booking.bookingId,
        orderType: "Booking",
        discountApplied: discount,
      });
    }

    const newTotal = booking.subtotal + booking.expressFee - discount;
    const requiredAdvance = Math.round(newTotal * 0.30);

    if (advancePayment < requiredAdvance) {
      return res.status(400).json({
        message: `Minimum advance payment of ₹${requiredAdvance} required`,
        requiredAdvance,
        providedAdvance: advancePayment,
      });
    }

    const balancePayment = newTotal - advancePayment;

    booking.discount = discount;
    booking.couponCode = couponCode || null;
    booking.total = newTotal;
    booking.paymentMethod = paymentMethod;
    booking.advancePayment = advancePayment;
    booking.balancePayment = balancePayment;
    booking.advancePaid = true;

    if (balancePayment === 0) {
      booking.paymentStatus = "Paid";
    } else {
      booking.paymentStatus = "Pending";
    }

    booking.statusTimeline.push({
      status: "Pending",
      timestamp: new Date(),
    });

    await booking.save();

    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Payment Received",
      title: "Payment Received",
      message: `Your advance payment of ₹${advancePayment} has been received. Booking ${booking.bookingId} is pending admin approval.`,
      relatedId: booking.bookingId,
      relatedType: "Booking",
      priority: "High",
    });

    console.log(`✅ Advance payment received: ${booking.bookingId}`);

    res.status(200).json({
      message: "Payment successful! ✅",
      bookingSummary: {
        bookingId: booking.bookingId,
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,

        service: {
          type: booking.serviceType,
          name: booking.serviceName,
          features: booking.package.services,
        },

        vehicle: {
          type: booking.vehicleType,
          number: booking.vehicleNumber,
          // ❌ model removed
        },

        schedule: {
          date: booking.scheduledDate,
          time: booking.scheduledTime,
          timeSlot: booking.timeSlot,
          expressService: booking.expressService,
        },

        address: booking.address,
        liveLocation: booking.liveLocation, // ✅ NEW

        pricing: {
          subtotal: booking.subtotal,
          expressFee: booking.expressFee,
          discount: discount,
          couponCode: couponCode || null,
          total: newTotal,
          advancePaid: advancePayment,
          balanceDue: balancePayment,
        },

        payment: {
          method: paymentMethod,
          paidAt: new Date(),
        },

        qrCode: booking.qrCode,
        createdAt: booking.createdAt,
      },
      note: balancePayment > 0
        ? `Payment successful! Your booking is pending admin approval. Balance of ₹${balancePayment} will be collected after service completion.`
        : "Payment successful! Your booking is pending admin approval.",
    });
  } catch (error) {
    console.error("❌ Advance payment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== MAKE BALANCE PAYMENT ====================
const makeBalancePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod,
      balancePayment,
      transactionId,
      paymentDetails,
    } = req.body;

    if (!paymentMethod || !balancePayment) {
      return res.status(400).json({
        message: "Payment method and balance amount required",
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if service is completed
    if (booking.status !== "Completed") {
      return res.status(400).json({
        message: "Balance payment only after service completion",
      });
    }

    // Check if already fully paid
    if (booking.paymentStatus === "Paid" && booking.balancePayment === 0) {
      return res.status(400).json({
        message: "Balance payment already completed",
      });
    }

    // Validate balance amount
    if (balancePayment < booking.balancePayment) {
      return res.status(400).json({
        message: `Balance payment of ₹${booking.balancePayment} required`,
        requiredBalance: booking.balancePayment,
        providedBalance: balancePayment,
      });
    }

    // ✅ Update with balance payment
    booking.balancePayment = 0;
    booking.paymentStatus = "Paid";
    booking.balanceTransactionId = transactionId || null;
    booking.balancePaymentMethod = paymentMethod;

    booking.statusTimeline.push({
      status: "Completed",
      timestamp: new Date(),
    });

    await booking.save();

    // Notify customer
    await Notification.create({
      recipientId: booking.customerId,
      recipientType: "Customer",
      type: "Payment Received",
      title: "Balance Payment Received",
      message: `Your balance payment of ₹${balancePayment} has been received. Thank you for using SparkleWash!`,
      relatedId: booking.bookingId,
      relatedType: "Booking",
      priority: "High",
    });

    console.log(`✅ Balance payment received: ${booking.bookingId}`);
    console.log(`   Amount: ₹${balancePayment}`);

    res.status(200).json({
      message: "Balance payment successful! ✅",
      booking: {
        bookingId: booking.bookingId,
        _id: booking._id,
        paymentStatus: booking.paymentStatus,
        totalPaid: booking.total,
        balanceDue: 0,
      },
      note: "Thank you! Please rate your experience.",
    });
  } catch (error) {
    console.error("❌ Balance payment error:", error);
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
      .populate("customerId", "fullName email phoneNumber")
      .populate("serviceId", "serviceName serviceType price");

    const count = await Booking.countDocuments({ status: "Pending" });

    res.status(200).json({
      message: "Pending bookings fetched",
      bookings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
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

    booking.status = "Confirmed";
    booking.statusTimeline.push({
      status: "Confirmed",
      timestamp: new Date(),
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
      priority: "High",
    });

    console.log(`✅ Booking approved: ${booking.bookingId}`);

    res.status(200).json({
      message: "Booking approved successfully ✅",
      booking,
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
  getAvailableServices,
  calculateBookingCost,
  createBooking,
  makeAdvancePayment,
  makeBalancePayment,
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