import express from "express";
import voucherControllers from "../controllers/VouchersControllers.js";

const router = express.Router();

// Create a new voucher
router.post("/createVoucher", voucherControllers.createVoucher);

// Get all vouchers (optionally filter by status)
router.get("/getAllVouchers", voucherControllers.getUserVouchers);

// Get vouchers by user ID
router.get("/getVouchersByUserId/:userId", voucherControllers.getUserVouchers);

// Get voucher by ID
router.get("/getVoucherById/:id", voucherControllers.getVoucherById);

// Get voucher by code
router.get("/getVoucherByCode/:code", voucherControllers.getVoucherByCode);

// Update voucher by ID
router.put("/updateVoucher/:id", voucherControllers.updateVoucher);

// Delete voucher by ID
router.delete("/deleteVoucher/:id", voucherControllers.deleteVoucher);

// Apply/Use voucher by code
router.post("/applyVoucher/:code", voucherControllers.applyVoucher);

// Validate voucher without using
router.post("/validateVoucher/:code", voucherControllers.validateVoucher);

// Update all expired vouchers
router.put("/updateExpiredVouchers", voucherControllers.updateExpiredVouchers);

export default router;
