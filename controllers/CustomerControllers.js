import Customer from "../models/customerModels.js";

// -------------------- Register User --------------------
const registerUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existing = await Customer.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = new Customer({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password, // storing plain text
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully ✅", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Login User --------------------
const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password)
      return res.status(400).json({ message: "Email/Phone and password are required" });

    const user = await Customer.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.password !== password)
      return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful ✅", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get All Users --------------------
const getAllUsers = async (req, res) => {
  try {
    const users = await Customer.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get User By ID --------------------
const getUserById = async (req, res) => {
  try {
    const user = await Customer.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update User --------------------
const updateUser = async (req, res) => {
  try {
    const updates = req.body;

    const user = await Customer.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User updated successfully ✅", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete User --------------------
const deleteUser = async (req, res) => {
  try {
    const user = await Customer.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
