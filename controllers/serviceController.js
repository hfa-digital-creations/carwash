    import mongoose from "mongoose";
    import Service from "../models/serviceModel.js";
    import WasherEmployee from "../models/repairTechnicianModel.js";

    // 🧾 CREATE SERVICE
    const createService = async (req, res) => {
    try {
        const { itemName, subTitle, description, minPrice, maxPrice, repairTechnicianId } = req.body;
        const itemImage = req.file ? req.file.path : req.body.itemImage;

        if (!itemName || !description || !minPrice || !maxPrice || !repairTechnicianId || !itemImage) {
        return res.status(400).json({ message: "All fields are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(repairTechnicianId)) {
        return res.status(400).json({ message: "Invalid repairTechnicianId" });
        }

        const technician = await WasherEmployee.findById(repairTechnicianId);
        if (!technician) return res.status(404).json({ message: "Technician not found" });
        if (technician.role !== "Repair Service Technician") {
        return res.status(400).json({ message: "Only repair technicians can create services" });
        }

        const newService = new Service({
        itemName,
        subTitle,
        description,
        itemImage,
        minPrice,
        maxPrice,
        repairTechnicianId,
        });

        await newService.save();
        res.status(201).json({ message: "Service created successfully", service: newService });
    } catch (error) {
        console.error("Create Service Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 📜 GET ALL SERVICES
    const getAllServices = async (req, res) => {
    try {
        const services = await Service.find().populate("repairTechnicianId", "fullName email role");
        res.status(200).json({ count: services.length, services });
    } catch (error) {
        console.error("Get All Services Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 🔍 GET SERVICE BY ID
    const getServiceById = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const service = await Service.findById(serviceId).populate("repairTechnicianId", "fullName email role");

        if (!service) return res.status(404).json({ message: "Service not found" });
        res.status(200).json(service);
    } catch (error) {
        console.error("Get Service By ID Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 🧑‍🔧 GET ALL SERVICES BY REPAIR TECHNICIAN ID
    const getAllServicesByRepairTechnicianId = async (req, res) => {
    try {
        const { repairTechnicianId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(repairTechnicianId)) {
        return res.status(400).json({ message: "Invalid technician ID" });
        }

        const services = await Service.find({ repairTechnicianId }).sort({ createdAt: -1 });
        res.status(200).json({ count: services.length, services });
    } catch (error) {
        console.error("Get Services By Technician Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // ✏️ UPDATE SERVICE
    const updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { itemName, subTitle, description, minPrice, maxPrice } = req.body;
        const itemImage = req.file ? req.file.path : req.body.itemImage;

        const updatedService = await Service.findByIdAndUpdate(
        serviceId,
        { itemName, subTitle, description, itemImage, minPrice, maxPrice },
        { new: true }
        );

        if (!updatedService) return res.status(404).json({ message: "Service not found" });
        res.status(200).json({ message: "Service updated successfully", service: updatedService });
    } catch (error) {
        console.error("Update Service Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 🗑️ DELETE SERVICE
    const deleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const deletedService = await Service.findByIdAndDelete(serviceId);

        if (!deletedService) return res.status(404).json({ message: "Service not found" });
        res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
        console.error("Delete Service Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    export default {
    createService,
    getAllServices,
    getServiceById,
    getAllServicesByRepairTechnicianId,
    updateService,
    deleteService,
    };
