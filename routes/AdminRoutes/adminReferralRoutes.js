import express from "express";
import adminReferalControllers from "../../controllers/AdminControllers/adminReferralController.js";

const router = express.Router();

router.get("/getAllReferrals",adminReferalControllers.getAllReferrals); // admin table
router.get("/getReferralDetailsByUserId/:id", adminReferalControllers.getReferralDetailsByUserId);
router.get("/getReferralById/:id",adminReferalControllers.getReferralById); // admin "View"
router.put("/updateReferralStatus/:id/status", adminReferalControllers.updateReferralStatus); // approve/reject

export default router;
