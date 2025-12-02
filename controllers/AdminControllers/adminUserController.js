import Customer from "../../models/customerModels.js";
import RepairTechnician from "../../models/repairTechnicianModel.js";
import ProductSeller from "../../models/productSellerModels.js";
import WasherEmployee from "../../models/washerEmpRegistrationModel.js";

// ✅ Activate / Deactivate user
 const toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body; // true or false

    const user = await Customer.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      message: `User has been ${isActive ? "activated" : "deactivated"} successfully ✅`,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Activate / Deactivate technician
 const toggleTechnicianActive = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const { isActive } = req.body; // true or false

    const technician = await RepairTechnician.findById(technicianId);
    if (!technician) return res.status(404).json({ message: "Technician not found" });

    technician.isActive = isActive;
    await technician.save();

    res.status(200).json({
      message: `Technician has been ${isActive ? "activated" : "deactivated"} successfully ✅`,
      technician,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Activate / Deactivate Product Seller
const toggleProductSellerActive = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { isActive } = req.body;

    const seller = await ProductSeller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "User not found" });

    seller.isActive = isActive;
    await seller.save();

    res.status(200).json({
      message: `Product Seller has been ${isActive ? "activated" : "deactivated"} successfully ✅`,
      seller,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Activate / Deactivate Washer or Delivery personnel
const toggleWasherDeliveryActive = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { isActive } = req.body;

    const employee = await WasherEmployee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    employee.isActive = isActive;
    await employee.save();

    res.status(200).json({
      message: `${employee.role} has been ${isActive ? "activated" : "deactivated"} successfully ✅`,
      employee,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
    toggleUserActive,
    toggleTechnicianActive,
    toggleProductSellerActive,
    toggleWasherDeliveryActive
}