    import mongoose from "mongoose";
    import AssignOrder from "../../models/AdminModels/assignOrderModel.js";
    import WasherEmployee from "../../models/washerEmpRegistrationModel.js"; // washer
    import RepairTechnician from "../../models/washerEmpRegistrationModel.js";
    import DeliveryPartner from "../../models/washerEmpRegistrationModel.js"; // if you have one

    // ✅ Assign/Create Order
    const createAssignOrder = async (req, res) => {
    try {
        const { customerName, serviceType, orderDate, assignedEmployee, employeeModel, description } = req.body;

        if (!customerName || !serviceType || !orderDate || !assignedEmployee || !employeeModel) {
        return res.status(400).json({ message: "All required fields must be provided" });
        }

        if (!mongoose.Types.ObjectId.isValid(assignedEmployee)) {
        return res.status(400).json({ message: "Invalid Employee ID" });
        }

        // Check if employee exists
        let employee;
        if (employeeModel === "WasherEmployee") employee = await WasherEmployee.findById(assignedEmployee);
        else if (employeeModel === "RepairTechnician") employee = await RepairTechnician.findById(assignedEmployee);
        else if (employeeModel === "DeliveryPartner") employee = await DeliveryPartner.findById(assignedEmployee);

        if (!employee) return res.status(404).json({ message: "Employee not found" });

        const assignOrder = new AssignOrder({
        customerName,
        serviceType,
        orderDate,
        assignedEmployee,
        employeeModel,
        description,
        status: "Assigned",
        });

        await assignOrder.save();
        res.status(201).json({ message: "Order assigned successfully", data: assignOrder });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 🔄 Update Assigned Order
    const updateAssignOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

        const updatedOrder = await AssignOrder.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

        res.status(200).json({ message: "Order updated successfully", data: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 🗑️ Delete Assigned Order
    const deleteAssignOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

        const deletedOrder = await AssignOrder.findByIdAndDelete(id);
        if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 📜 Get All Assigned Orders
    const getAllAssignOrders = async (req, res) => {
    try {
        const orders = await AssignOrder.find()
        .populate("assignedEmployee", "fullName email role")
        .sort({ createdAt: -1 });

        res.status(200).json({ count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // 🔍 Get Assigned Order by ID
    const getAssignOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

        const order = await AssignOrder.findById(id).populate("assignedEmployee", "fullName email role");
        if (!order) return res.status(404).json({ message: "Order not found" });

        res.status(200).json({ data: order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    // ❌ Decline/Cancel Assigned Order
    const declineAssignOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

        const order = await AssignOrder.findByIdAndUpdate(id, { status: "Cancelled" }, { new: true });
        if (!order) return res.status(404).json({ message: "Order not found" });

        res.status(200).json({ message: "Order cancelled successfully", data: order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
    };

    export default {
    createAssignOrder,
    updateAssignOrder,
    deleteAssignOrder,
    getAllAssignOrders,
    getAssignOrderById,
    declineAssignOrder,
    };
