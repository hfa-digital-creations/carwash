import Voucher from "../models/VouchersModels.js";

// 🔹 Helper: Format voucher for UI
const formatVoucherForUI = (voucher) => ({
  _id: voucher._id,
  code: voucher.code,
  type: voucher.type,
  displayValue: voucher.displayValue,
  value: voucher.value,
  status: voucher.status,
  expiryDate: voucher.expiryDate,
  usedDate: voucher.usedDate,
  expiryText: `Expires: ${new Date(voucher.expiryDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}`,
  termsAndConditions: voucher.termsAndConditions,
  icon: voucher.icon,
  backgroundColor: voucher.backgroundColor,
  canUse: voucher.canBeUsed(),
});

// 🔹 Get all vouchers for a user
 const getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    await Voucher.updateExpiredVouchers();

    const query = { userId };
    if (status) query.status = status.toUpperCase();

    const vouchers = await Voucher.find(query).sort({ createdAt: -1 });

    const stats = {
      totalVouchers: vouchers.length,
      active: vouchers.filter((v) => v.status === "ACTIVE").length,
      used: vouchers.filter((v) => v.status === "USED").length,
      expired: vouchers.filter((v) => v.status === "EXPIRED").length,
      totalPotentialSavings: vouchers
        .filter((v) => v.status === "ACTIVE")
        .reduce((sum, v) => sum + v.value, 0),
    };

    res.status(200).json({ success: true, data: vouchers, stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vouchers",
      error: error.message,
    });
  }
};

// 🔹 Get voucher by ID
 const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findById(id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    res.status(200).json({ success: true, data: voucher });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching voucher",
      error: error.message,
    });
  }
};

// 🔹 Get voucher by code
 const getVoucherByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const voucher = await Voucher.findOne({ code: code.toUpperCase() });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    res.status(200).json({ success: true, data: voucher });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching voucher",
      error: error.message,
    });
  }
};

// 🔹 Create a new voucher
 const createVoucher = async (req, res) => {
  try {
    const voucherData = req.body;

    const existingVoucher = await Voucher.findOne({ code: voucherData.code });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: "Voucher code already exists",
      });
    }

    const voucher = new Voucher(voucherData);
    await voucher.save();

    res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      data: voucher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating voucher",
      error: error.message,
    });
  }
};

// 🔹 Update voucher
 const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const voucher = await Voucher.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    res.status(200).json({
      success: true,
      message: "Voucher updated successfully",
      data: voucher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating voucher",
      error: error.message,
    });
  }
};

// 🔹 Apply/Use a voucher
 const applyVoucher = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount, userId } = req.body;

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      userId,
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    if (!voucher.canBeUsed()) {
      return res.status(400).json({
        success: false,
        message: "Voucher cannot be used. It may be expired or already used.",
      });
    }

    if (orderAmount < voucher.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${voucher.minOrderAmount} required`,
      });
    }

    let discount = 0;
    if (voucher.type === "PERCENTAGE") {
      discount = (orderAmount * voucher.value) / 100;
      if (voucher.maxDiscount && discount > voucher.maxDiscount) discount = voucher.maxDiscount;
    } else if (["CASHBACK", "FLAT"].includes(voucher.type)) {
      discount = voucher.value;
    }

    await voucher.markAsUsed();

    res.status(200).json({
      success: true,
      message: "Voucher applied successfully",
      data: { voucher, discount, finalAmount: orderAmount - discount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error applying voucher",
      error: error.message,
    });
  }
};

// 🔹 Validate voucher (without marking used)
 const validateVoucher = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount, userId } = req.body;

    const voucher = await Voucher.findOne({
      code: code.toUpperCase(),
      userId,
    });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    if (!voucher.canBeUsed()) {
      return res.status(400).json({
        success: false,
        message: "Voucher is not valid",
        reason: voucher.status === "EXPIRED" ? "expired" : "already_used",
      });
    }

    if (orderAmount < voucher.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${voucher.minOrderAmount} required`,
      });
    }

    let discount = 0;
    if (voucher.type === "PERCENTAGE") {
      discount = (orderAmount * voucher.value) / 100;
      if (voucher.maxDiscount && discount > voucher.maxDiscount) discount = voucher.maxDiscount;
    } else if (["CASHBACK", "FLAT"].includes(voucher.type)) {
      discount = voucher.value;
    }

    res.status(200).json({
      success: true,
      message: "Voucher is valid",
      data: { voucher, discount, finalAmount: orderAmount - discount },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validating voucher",
      error: error.message,
    });
  }
};

// 🔹 Delete voucher
 const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findByIdAndDelete(id);

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    res.status(200).json({ success: true, message: "Voucher deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting voucher",
      error: error.message,
    });
  }
};

export default {
    formatVoucherForUI,
    getUserVouchers,
    getVoucherById,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    applyVoucher,
    validateVoucher,
    deleteVoucher
}