import Address from "../models/createAddressModels.js";

// CREATE Address
const createAddress = async (req, res) => {
  try {
    const { street, city, pincode, maxCars, location } = req.body;

    if (!street || !city || !pincode || !location?.coordinates) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newAddress = new Address({ street, city, pincode, maxCars, location });
    await newAddress.save();

    res.status(201).json({ message: "Address created successfully", address: newAddress });
  } catch (error) {
    console.error("Error creating address:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET all addresses
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find();
    res.status(200).json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET single address by ID
const getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.status(200).json({ address });
  } catch (error) {
    console.error("Error fetching address:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE address
const updateAddress = async (req, res) => {
  try {
    const updatedAddress = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedAddress) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address updated successfully", address: updatedAddress });
  } catch (error) {
    console.error("Error updating address:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE address
const deleteAddress = async (req, res) => {
  try {
    const deletedAddress = await Address.findByIdAndDelete(req.params.id);
    if (!deletedAddress) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  createAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress
};
