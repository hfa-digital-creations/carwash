import WasherEmployee from "../models/washerEmpRegistrationModel.js";
import Referral from "../models/ReferralModel.js";
import mongoose from "mongoose";

// Create new washer employee with file upload
const createWasherEmployee = async (req, res) => {
  try {
    const body = req.body;

    // ✅ Check for existing phone/email
    const existingPhone = await WasherEmployee.findOne({ phone: body.phone });
    if (existingPhone) return res.status(400).json({ message: "Phone number already exists" });

    const existingEmail = await WasherEmployee.findOne({ email: body.email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    // ✅ Generate unique referral code
    let referralCode = "";
    let codeExists = true;
    while (codeExists) {
      referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCode = await WasherEmployee.findOne({ referralCode });
      if (!existingCode) codeExists = false;
    }

    const data = {
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      password: body.password,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      serviceCategories: body.serviceCategories?.split(",") || [],
      role: body.role,
      referralCode, // set generated code
      referredBy: body.referredBy || null,
      address: {
        street: body.street,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        location: { type: "Point", coordinates: [body.longitude, body.latitude] },
      },
      emergencyContact: { name: body.emergencyName, phone: body.emergencyPhone },
      vehicle: {
        type: body.vehicleType,
        model: body.vehicleModel,
        licensePlate: body.licensePlate,
        registrationCertificate: req.files?.registrationCertificate?.[0]?.path,
        drivingLicense: req.files?.drivingLicense?.[0]?.path,
        documentVerified: false,
      },
      bankDetails: {
        accountHolderName: body.accountHolderName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        aadhaarCard: req.files?.aadhaarCard?.[0]?.path,
      },
      termsAccepted: body.termsAccepted === "true",
    };

    // ✅ Create employee
    const newEmployee = await WasherEmployee.create(data);

    // ✅ Create Referral Record if referredBy code is used
    if (body.referredBy) {
  const referrer = await WasherEmployee.findOne({ referralCode: body.referredBy });

  if (referrer) {
    await Referral.create({
      referrerId: referrer._id,
      referrerName: referrer.fullName,
      referrerType: "WasherEmployee",
      referralCode: referrer.referralCode,
      referredUserId: newEmployee._id,
      referredUserName: newEmployee.fullName,
      referredUserType: "WasherEmployee",
      usedCode: body.referredBy,
      signupDate: newEmployee.createdAt,
      status: "Pending",
    });
  }
}

    res.status(201).json({ message: "Washer employee created", employee: newEmployee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// Update washer employee by ID with file upload
const updateWasherEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });

    // Build updates object with nested structure
    const updates = {
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      password: body.password,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      referralCode: body.referralCode,
      serviceCategories: body.serviceCategories?.split(",") || [],
      role: body.role,
      address: {
        street: body.street,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        location: {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        },
      },
      emergencyContact: {
        name: body.emergencyName,
        phone: body.emergencyPhone,
      },
      vehicle: {
        type: body.vehicleType,
        model: body.vehicleModel,
        licensePlate: body.licensePlate,
        registrationCertificate: req.files?.registrationCertificate?.[0]?.path,
        drivingLicense: req.files?.drivingLicense?.[0]?.path,
        documentVerified: false,
      },
      bankDetails: {
        accountHolderName: body.accountHolderName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        aadhaarCard: req.files?.aadhaarCard?.[0]?.path,
      },
      termsAccepted: body.termsAccepted === "true",
    };

    // Remove undefined fields to avoid overwriting existing values
    Object.keys(updates).forEach(
      key => updates[key] === undefined && delete updates[key]
    );

    const updatedEmployee = await WasherEmployee.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedEmployee)
      return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee updated", employee: updatedEmployee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Other controllers remain the same
const getAllWasherEmployees = async (req, res) => {
  try {
    const employees = await WasherEmployee.find().sort({ createdAt: -1 });
    res.json({ employees });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getWasherEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

    const employee = await WasherEmployee.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.json({ employee });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteWasherEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

    const deletedEmployee = await WasherEmployee.findByIdAndDelete(id);
    if (!deletedEmployee) return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  createWasherEmployee,
  getAllWasherEmployees,
  getWasherEmployeeById,
  updateWasherEmployee,
  deleteWasherEmployee,
};
