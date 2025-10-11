import WasherEmployee from "../models/washerEmpRegistrationModel.js";
import mongoose from "mongoose";

// Create new washer employee
 const createWasherEmployee = async (req, res) => {
  try {
    const data = req.body;
    // TODO: Hash password before saving if required
    const newEmployee = await WasherEmployee.create(data);
    res.status(201).json({ message: "Washer employee created", employee: newEmployee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all washer employees
 const getAllWasherEmployees = async (req, res) => {
  try {
    const employees = await WasherEmployee.find().sort({ createdAt: -1 });
    res.json({ employees });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single washer employee by ID
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

// Update washer employee by ID
 const updateWasherEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

    const updatedEmployee = await WasherEmployee.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedEmployee) return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee updated", employee: updatedEmployee });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete washer employee by ID
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
    createWasherEmployee ,
    getAllWasherEmployees ,
    getWasherEmployeeById ,
    updateWasherEmployee ,
    deleteWasherEmployee 
}