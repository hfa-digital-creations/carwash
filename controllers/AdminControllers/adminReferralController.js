import ReferralDetail from "../../models/AdminModels/adminReferralDetail.js";
import mongoose from "mongoose";

// 🔹 Create a referral record (called after user signup)
const createReferral = async (referrer, referred) => {
  try {
    const newReferral = new ReferralDetail({
      referrerId: referrer._id,
      referrerName: referrer.fullName,
      referrerType: referrer.modelType, // e.g., "Customer", "Employee", etc.
      referralCode: referrer.referralCode,

      referredUserId: referred._id,
      referredUserName: referred.fullName,
      referredUserType: referred.modelType,
      signupDate: referred.createdAt,
      usedCode: referred.referredBy,
      status: "Pending", // default status
    });

    await newReferral.save();
    console.log("✅ Referral created successfully");
  } catch (error) {
    console.error("❌ Error creating referral:", error.message);
  }
};

// 🔹 Admin: get all referrals (table view)
const getAllReferrals = async (req, res) => {
  const referrals = await Referral.find().sort({ createdAt: -1 });
  res.json({ message: "Fetched successfully", data: referrals });
};

// 🔹 Get referral details by user ID (for all user types)
const getReferralDetailsByUserId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const referral = await ReferralDetail.findOne({
      $or: [
        { referrerId: new mongoose.Types.ObjectId(id) },
        { referredUserId: new mongoose.Types.ObjectId(id) },
      ],
    });

    if (!referral) {
      return res.status(404).json({ message: "No referral found for this user ID" });
    }

    const successCount = await ReferralDetail.countDocuments({
      referrerId: referral.referrerId,
      status: "Approved",
    });

    res.status(200).json({
      message: "Referral details fetched successfully",
      data: {
        referrerDetails: {
          referrerName: referral.referrerName,
          referrerId: referral.referrerId,
          referrerType: referral.referrerType,
          referralCode: referral.referralCode,
          totalSuccessfulReferrals: successCount,
        },
        referredPersonDetails: {
          newUserName: referral.referredUserName,
          userType: referral.referredUserType,
          signupDate: referral.signupDate,
          usedCode: referral.usedCode,
          status: referral.status,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching referral details by user ID",
      error: error.message,
    });
  }
};


// 🔹 Admin: get single referral details (View button)
const getReferralById = async (req, res) => {
  const referral = await Referral.findById(req.params.id);
  res.json({ data: referral });
};

// 🔹 Admin: approve/reject referral
const updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedReferral = await ReferralDetail.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedReferral)
      return res.status(404).json({ message: "Referral not found" });

    res.status(200).json({
      message: `Referral ${status}`,
      data: updatedReferral,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating referral status",
      error: error.message,
    });
  }
};

export default {
  createReferral,
  getAllReferrals,
  getReferralDetailsByUserId,
  getReferralById,
  updateReferralStatus,
};
