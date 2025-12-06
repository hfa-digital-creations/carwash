import Service from "../../models/AdminModels/serviceModel.js";


// ==================== CREATE SERVICE ====================
const createService = async (req, res) => {
  try {
    const {
      serviceType,
      serviceName,
      description,
      features,
      duration,
      price,
      expressServiceAvailable,
      expressFee,
    } = req.body;

    if (!serviceType || !serviceName || !description || !duration || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check duplicate
    const existing = await Service.findOne({
      serviceType,
      serviceName,
    });

    if (existing) {
      return res.status(400).json({
        message: `${serviceName} already exists for ${serviceType}`,
      });
    }

    const newService = await Service.create({
      serviceType,
      serviceName,
      description,
      features,
      duration,
      price,
      expressServiceAvailable: expressServiceAvailable !== undefined ? expressServiceAvailable : true,
      expressFee: expressFee || 0,
      isActive: true,
      createdBy: req.admin._id,
    });

    console.log(`✅ Service created: ${serviceName} - ${serviceType}`);

    res.status(201).json({
      message: "Service created successfully ✅",
      service: newService,
    });
  } catch (error) {
    console.error("❌ Create service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET ALL SERVICES ====================
const getAllServices = async (req, res) => {
  try {
    const { serviceType, isActive } = req.query;

    let filter = {};
    if (serviceType) filter.serviceType = serviceType;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const services = await Service.find(filter).sort({ serviceType: 1, price: 1 });

    res.status(200).json({
      message: "Services fetched successfully",
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("❌ Get services error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET SERVICES BY TYPE (PUBLIC) ====================
const getServicesByType = async (req, res) => {
  try {
    const { serviceType } = req.params;

    if (!["Car Wash", "Bike Wash"].includes(serviceType)) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    const services = await Service.find({
      serviceType,
      isActive: true,
    }).sort({ price: 1 });

    res.status(200).json({
      message: `${serviceType} services fetched`,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("❌ Get services by type error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET SERVICE BY ID ====================
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      message: "Service fetched successfully",
      service,
    });
  } catch (error) {
    console.error("❌ Get service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== UPDATE SERVICE ====================
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      service[key] = updateData[key];
    });

    await service.save();

    console.log(`✅ Service updated: ${service.serviceName}`);

    res.status(200).json({
      message: "Service updated successfully ✅",
      service,
    });
  } catch (error) {
    console.error("❌ Update service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== TOGGLE SERVICE STATUS ====================
const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const service = await Service.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    console.log(`✅ Service ${isActive ? "activated" : "deactivated"}: ${service.serviceName}`);

    res.status(200).json({
      message: `Service ${isActive ? "activated" : "deactivated"} successfully ✅`,
      service,
    });
  } catch (error) {
    console.error("❌ Toggle service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== DELETE SERVICE ====================
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    console.log(`✅ Service deleted: ${service.serviceName}`);

    res.status(200).json({
      message: "Service deleted successfully ✅",
    });
  } catch (error) {
    console.error("❌ Delete service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  createService,
  getAllServices,
  getServicesByType,
  getServiceById,
  updateService,
  toggleServiceStatus,
  deleteService,
};