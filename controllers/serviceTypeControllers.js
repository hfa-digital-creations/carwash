import WashService from "../models/washServiceType.js";

// 🟢 Create Service Type
const createServiceType = async (req, res) => {
  try {
    const service = await WashService.create(req.body);
    res.status(201).json({ message: "Service created successfully", service });
  } catch (error) {
    res.status(500).json({ message: "Error creating service", error: error.message });
  }
};

// 🟡 Get All Service Types
const getAllServiceTypes = async (req, res) => {
  try {
    const services = await WashService.find();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Error fetching services", error: error.message });
  }
};

// 🟢 Get Service Type By ID
const getServiceTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await WashService.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Error fetching service", error: error.message });
  }
};

// 🟣 Update Service Type
const updateServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await WashService.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({ message: "Service updated successfully", updatedService });
  } catch (error) {
    res.status(500).json({ message: "Error updating service", error: error.message });
  }
};

// 🔴 Delete Service Type
const deleteServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedService = await WashService.findByIdAndDelete(id);

    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting service", error: error.message });
  }
};

// 🟢 Default export
export default {
  createServiceType,
  getAllServiceTypes,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
};
